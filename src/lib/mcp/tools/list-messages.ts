import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_messages",
  title: "List messages",
  description: "Read the message history between the signed-in user and another user, oldest first.",
  inputSchema: {
    with_user_id: z.string().uuid().describe("The other participant's profile id."),
    limit: z.number().int().min(1).max(200).default(50).describe("Maximum messages to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ with_user_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const me = ctx.getUserId()!;
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("messages")
      .select("id, sender_id, receiver_id, message_text, created_at")
      .or(
        `and(sender_id.eq.${me},receiver_id.eq.${with_user_id}),and(sender_id.eq.${with_user_id},receiver_id.eq.${me})`,
      )
      .order("created_at", { ascending: false })
      .limit(limit ?? 50);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const messages = (data ?? []).slice().reverse();
    return {
      content: [{ type: "text", text: JSON.stringify(messages) }],
      structuredContent: { messages },
    };
  },
});
