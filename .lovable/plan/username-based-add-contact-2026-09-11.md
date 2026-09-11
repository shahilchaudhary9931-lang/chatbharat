# Username-based Add Contact

## What will change
- Replace phone/email contact entry with a name or username search.
- Show matching registered profiles, excluding the signed-in user.
- Open the selected user's existing one-to-one conversation, or a new empty conversation if none exists.
- Keep the current chat and messages flow unchanged; the first sent message will continue creating the conversation naturally.
- Update Contacts and empty-chat wording in English and Hindi.

## Technical details
- Add an authenticated profile-search server function that safely searches the existing `profiles.username` field.
- Reuse the existing `/chat/$id` route and current messages table; no new records are created merely by selecting a user.
- Do not modify authentication, OTP, database schema, RLS policies, or existing messages.
- Validate the search and navigation flow in the running mobile preview.
