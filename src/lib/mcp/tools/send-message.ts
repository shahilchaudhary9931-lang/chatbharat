import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "send_message",
  title: "Send message",
  description: "Send a text message from the signed-in user to another user in the chat app.",
  inputSchema: {
    to_user_id: z.string().uuid().describe("Recipient's profile id."),
    text: z.string().trim().min(1).max(4000).describe("Message text to send."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ to_user_id, text }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("messages")
      .insert({ sender_id: ctx.getUserId()!, receiver_id: to_user_id, message_text: text })
      .select("id, sender_id, receiver_id, message_text, created_at")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Message sent (${data.id}).` }],
      structuredContent: { message: data },
    };
  },
});
