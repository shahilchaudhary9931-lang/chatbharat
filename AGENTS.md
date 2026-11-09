# Project architecture rules

- Restrict authenticated message updates with both column-level grants and participant-scoped RLS; enforce immutable content and sender-only soft deletion in the trigger, and require attachments to belong to the sender before participant reads are allowed.