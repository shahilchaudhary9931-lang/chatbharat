import { auth, defineMcp } from "@lovable.dev/mcp-js";
import myProfileTool from "./tools/my-profile";
import listConversationsTool from "./tools/list-conversations";
import listMessagesTool from "./tools/list-messages";
import sendMessageTool from "./tools/send-message";

// The OAuth issuer must be the direct Supabase host; the project ref is the only
// value that survives publish unchanged.
const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "bhasha-chat",
  title: "Bhasha Chat",
  version: "0.1.0",
  instructions:
    "Tools for the Bhasha Chat messaging app. Use `my_profile` to identify the signed-in user, `list_conversations` to find chat partners, `list_messages` to read a thread, and `send_message` to send a text message.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [myProfileTool, listConversationsTool, listMessagesTool, sendMessageTool],
});
