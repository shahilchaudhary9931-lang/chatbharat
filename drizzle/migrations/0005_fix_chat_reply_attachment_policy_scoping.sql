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
        FROM public.messages AS replied
        WHERE replied.id = public.messages.reply_to_id
          AND (
            (replied.sender_id = auth.uid() AND replied.receiver_id = public.messages.receiver_id)
            OR (replied.receiver_id = auth.uid() AND replied.sender_id = public.messages.receiver_id)
          )
      )
    )
  );