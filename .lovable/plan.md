# ChatBharat launch-ready improvements

## What will change
- Show text messages immediately, clear the composer without waiting for the network, then reconcile the bubble with the saved message; visibly report failures and allow retry.
- Add a shareable personal invite link and QR code to the profile, plus an Invite Friends entry in Settings. Opening the invite should reach that person’s one-to-one chat, preserving the destination through sign-in.
- Compress supported photos in the browser before upload, while keeping the original when compression is unsupported or would make the file larger. Leave PDFs, voice notes, and other files untouched.

## Technical approach
- Use the existing message and storage flows; no database migration or RLS changes. Keep optimistic state keyed to the message ID so realtime events and the insert response cannot create duplicate bubbles.
- Add a small invite route that validates the target ID and stores only the intended navigation path for signed-out visitors; continue through existing authentication.
- Use a QR-code package for reliable scannable codes, and browser canvas encoding for photo compression. Use existing design tokens and bilingual labels.

## Verification
- Run project type/build diagnostics and inspect the preview. Exercise invite generation and navigation, then verify optimistic send success/failure handling and photo compression fallback without altering existing records.
