CREATE TABLE public.message_pins (
  message_id uuid PRIMARY KEY REFERENCES public.messages(id) ON DELETE CASCADE,
  pinned_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.message_pins TO authenticated;
GRANT ALL ON public.message_pins TO service_role;
ALTER TABLE public.message_pins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants view pins" ON public.message_pins FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())));
CREATE POLICY "Participants pin" ON public.message_pins FOR INSERT TO authenticated
WITH CHECK (auth.uid() = pinned_by AND EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())));
CREATE POLICY "Participants unpin" ON public.message_pins FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())));
ALTER TABLE public.message_pins REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_pins;