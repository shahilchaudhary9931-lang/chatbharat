import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});

export const lookupProfileByEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("id, username, email")
      .eq("email", data.email)
      .neq("id", context.userId)
      .maybeSingle();

    if (error) {
      console.error("Profile lookup failed", { code: error.code });
      throw new Error("Unable to search for that user right now");
    }

    return profile;
  });