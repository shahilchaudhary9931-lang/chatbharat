ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS reply_to_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS attachment_path text,
  ADD COLUMN IF NOT EXISTS attachment_name text,
  ADD COLUMN IF NOT EXISTS attachment_type text,
  ADD COLUMN IF NOT EXISTS read_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_for_everyone boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen timestamptz;

GRANT UPDATE (read_at, deleted_for_everyone) ON public.messages TO authenticated;
CREATE POLICY "Participants can update message flags" ON public.messages FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE OR REPLACE FUNCTION public.guard_message_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.read_at IS DISTINCT FROM OLD.read_at AND auth.uid() IS DISTINCT FROM OLD.receiver_id THEN
    RAISE EXCEPTION 'Only the receiver can mark as read';
  END IF;
  IF NEW.deleted_for_everyone IS DISTINCT FROM OLD.deleted_for_everyone THEN
    IF auth.uid() IS DISTINCT FROM OLD.sender_id OR NEW.deleted_for_everyone = false THEN
      RAISE EXCEPTION 'Only the sender can delete for everyone';
    END IF;
    NEW.message_text := '';
    NEW.attachment_path := NULL;
    NEW.attachment_name := NULL;
    NEW.attachment_type := NULL;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.guard_message_update() FROM public, anon, authenticated;
CREATE TRIGGER messages_guard_update BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.guard_message_update();

CREATE TABLE public.message_hidden (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, message_id)
);
GRANT SELECT, INSERT, DELETE ON public.message_hidden TO authenticated;
GRANT ALL ON public.message_hidden TO service_role;
ALTER TABLE public.message_hidden ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own hidden messages" ON public.message_hidden FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.user_blocks (
  blocker_id uuid NOT NULL DEFAULT auth.uid(),
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);
GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;
GRANT ALL ON public.user_blocks TO service_role;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own blocks" ON public.user_blocks FOR ALL TO authenticated
  USING (auth.uid() = blocker_id) WITH CHECK (auth.uid() = blocker_id);

CREATE OR REPLACE FUNCTION public.is_blocked_between(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = _a AND blocked_id = _b) OR (blocker_id = _b AND blocked_id = _a));
$$;
REVOKE EXECUTE ON FUNCTION public.is_blocked_between(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_blocked_between(uuid, uuid) TO authenticated;

CREATE POLICY "No messages when blocked" ON public.messages AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (NOT public.is_blocked_between(sender_id, receiver_id));

CREATE TABLE public.user_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL DEFAULT auth.uid(),
  reported_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.user_reports TO authenticated;
GRANT ALL ON public.user_reports TO service_role;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can file reports" ON public.user_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Upload own chat media" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-media' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Read chat media as participant" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'chat-media' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (SELECT 1 FROM public.messages m WHERE m.attachment_path = storage.objects.name
      AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid()))
  ));

ALTER TABLE public.messages REPLICA IDENTITY FULL;