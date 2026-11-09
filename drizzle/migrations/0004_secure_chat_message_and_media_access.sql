-- Limit message updates to the authenticated participant's intended status fields.
REVOKE UPDATE ON TABLE public.messages FROM authenticated;
GRANT UPDATE (read_at, deleted_for_everyone) ON TABLE public.messages TO authenticated;
REVOKE DELETE ON TABLE public.messages FROM authenticated;

DROP POLICY IF EXISTS "Participants can update message flags" ON public.messages;
CREATE POLICY "Receivers can update read status"
  ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);
CREATE POLICY "Senders can soft delete messages for everyone"
  ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can delete messages they sent or received" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their sent messages" ON public.messages;

CREATE OR REPLACE FUNCTION public.guard_message_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Trusted server operations may bypass the authenticated-user restrictions.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
    OR NEW.receiver_id IS DISTINCT FROM OLD.receiver_id
    OR NEW.message_text IS DISTINCT FROM OLD.message_text
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
    OR NEW.reply_to_id IS DISTINCT FROM OLD.reply_to_id
    OR NEW.attachment_path IS DISTINCT FROM OLD.attachment_path
    OR NEW.attachment_name IS DISTINCT FROM OLD.attachment_name
    OR NEW.attachment_type IS DISTINCT FROM OLD.attachment_type THEN
    RAISE EXCEPTION 'Message content and participants cannot be changed';
  END IF;

  IF NEW.read_at IS DISTINCT FROM OLD.read_at AND auth.uid() IS DISTINCT FROM OLD.receiver_id THEN
    RAISE EXCEPTION 'Only the receiver can mark as read';
  END IF;

  IF NEW.deleted_for_everyone IS DISTINCT FROM OLD.deleted_for_everyone THEN
    IF auth.uid() IS DISTINCT FROM OLD.sender_id
      OR OLD.deleted_for_everyone
      OR NOT NEW.deleted_for_everyone THEN
      RAISE EXCEPTION 'Only the sender can delete a message for everyone';
    END IF;
    NEW.message_text := '';
    NEW.attachment_path := NULL;
    NEW.attachment_name := NULL;
    NEW.attachment_type := NULL;
  END IF;

  RETURN NEW;
END
$function$;

DROP POLICY IF EXISTS "Users can send messages as themselves" ON public.messages;
CREATE POLICY "Users can send messages as themselves"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      attachment_path IS NULL
      OR (storage.foldername(attachment_path))[1] = auth.uid()::text
    )
    AND (
      reply_to_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.messages replied
        WHERE replied.id = reply_to_id
          AND (
            (replied.sender_id = auth.uid() AND replied.receiver_id = receiver_id)
            OR (replied.receiver_id = auth.uid() AND replied.sender_id = receiver_id)
          )
      )
    )
  );

DROP POLICY IF EXISTS "Read chat media as participant" ON storage.objects;
CREATE POLICY "Read chat media as participant"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-media'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1
        FROM public.messages m
        WHERE m.attachment_path = objects.name
          AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
          AND (storage.foldername(objects.name))[1] = m.sender_id::text
      )
    )
  );