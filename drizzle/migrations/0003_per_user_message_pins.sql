-- Pins are per user: each participant can pin/unpin independently.
ALTER TABLE public.message_pins DROP CONSTRAINT message_pins_pkey;
ALTER TABLE public.message_pins ADD CONSTRAINT message_pins_pkey PRIMARY KEY (message_id, pinned_by);