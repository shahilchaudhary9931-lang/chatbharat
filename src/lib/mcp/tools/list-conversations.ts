import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_conversations",
  title: "List conversations",
  description:
    "List the signed-in user's one-to-one conversations, newest first, with the other person's id and the latest message.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).default(20).describe("Maximum conversations to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const me = ctx.getUserId()!;
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("messages")
      .select("id, sender_id, receiver_id, message_text, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const seen = new Map<string, { with_user_id: string; last_message: string; last_message_at: string; direction: string }>();
    for (const row of data ?? []) {
      const other = row.sender_id === me ? row.receiver_id : row.sender_id;
      if (seen.has(other)) continue;
      seen.set(other, {
        with_user_id: other,
        last_message: row.message_text,
        last_message_at: row.created_at,
        direction: row.sender_id === me ? "sent" : "received",
      });
      if (seen.size >= (limit ?? 20)) break;
    }
    const conversations = [...seen.values()];
    return {
      content: [{ type: "text", text: JSON.stringify(conversations) }],
      structuredContent: { conversations },
    };
  },
});
