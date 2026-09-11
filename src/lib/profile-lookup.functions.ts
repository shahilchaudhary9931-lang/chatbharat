import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  query: z.string().trim().max(60),
});

export const searchProfilesByUsername = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let request = supabaseAdmin
      .from("profiles")
      .select("id, username, about, avatar_url")
      .neq("id", context.userId)
      .not("username", "is", null)
      .order("username", { ascending: true })
      .limit(30);

    if (data.query) {
      const escapedQuery = data.query.replaceAll("%", "\\%").replaceAll("_", "\\_");
      request = request.ilike("username", `%${escapedQuery}%`);
    }

    const { data: profiles, error } = await request;

    if (error) {
      console.error("Profile search failed", { code: error.code });
      throw new Error("Unable to search users right now");
    }

    return profiles ?? [];
  });