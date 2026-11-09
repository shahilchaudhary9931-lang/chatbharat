# Performance optimization roadmap

- [x] Close message mutation and attachment ownership authorization gaps without deleting existing data. (Applied database restrictions and safe per-user hiding.)
- [x] Fix authenticated participant access to reply, reactions, pins, and per-user message hiding; preserve sender-only delete-for-everyone. (Verified with two accounts on the live preview; message_pins made per-user via migration 0003.)
- [ ] Audit startup, chat, contacts/search, media, and realtime hot paths.
- [ ] Implement targeted safe performance improvements without changing features or UI.
- [ ] Apply and verify any justified database indexes.
- [ ] Validate type/build diagnostics and inspect the completed roadmap.
