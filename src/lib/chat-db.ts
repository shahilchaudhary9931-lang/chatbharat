import { supabase } from "@/integrations/supabase/client";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MSG_COLS =
  "id, sender_id, receiver_id, message_text, created_at, reply_to_id, attachment_path, attachment_name, attachment_type, read_at, deleted_for_everyone";

export interface DbMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  created_at: string;
  reply_to_id: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  read_at: string | null;
  deleted_for_everyone: boolean;
}

export interface Conversation {
  peerId: string;
  peerName: string;
  peerAvatar: string | null;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

async function hiddenIds(): Promise<Set<string>> {
  const { data } = await supabase.from("message_hidden").select("message_id").limit(2000);
  return new Set((data ?? []).map((r) => r.message_id));
}

export function previewOf(m: Pick<DbMessage, "message_text" | "attachment_type" | "attachment_name" | "deleted_for_everyone">) {
  if (m.deleted_for_everyone) return "🚫 This message was deleted";
  if (m.attachment_type?.startsWith("image/")) return "📷 " + (m.message_text || "Photo");
  if (m.attachment_type) return "📄 " + (m.attachment_name || "File");
  return m.message_text;
}

export async function fetchConversations(userId: string): Promise<Conversation[]> {
  const [{ data: msgs, error }, hidden] = await Promise.all([
    supabase.from("messages").select(MSG_COLS).order("created_at", { ascending: false }).limit(500),
    hiddenIds(),
  ]);
  if (error || !msgs) return [];

  const byPeer = new Map<string, DbMessage>();
  const unread = new Map<string, number>();
  for (const m of msgs as DbMessage[]) {
    if (hidden.has(m.id)) continue;
    const peer = m.sender_id === userId ? m.receiver_id : m.sender_id;
    if (!byPeer.has(peer)) byPeer.set(peer, m);
    if (m.receiver_id === userId && !m.read_at && !m.deleted_for_everyone) {
      unread.set(peer, (unread.get(peer) ?? 0) + 1);
    }
  }
  const peerIds = [...byPeer.keys()];
  if (peerIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, email, avatar_url")
    .in("id", peerIds);
  const profileOf = (id: string) => profiles?.find((x) => x.id === id);

  return peerIds.map((peerId) => {
    const m = byPeer.get(peerId)!;
    const p = profileOf(peerId);
    return {
      peerId,
      peerName: p?.username || p?.email || "Unknown",
      peerAvatar: p?.avatar_url ?? null,
      lastMessage: previewOf(m),
      lastAt: m.created_at,
      unread: unread.get(peerId) ?? 0,
    };
  });
}

export async function fetchThread(userId: string, peerId: string): Promise<DbMessage[]> {
  const [{ data }, hidden] = await Promise.all([
    supabase
      .from("messages")
      .select(MSG_COLS)
      .or(
        `and(sender_id.eq.${userId},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${userId})`,
      )
      .order("created_at", { ascending: true })
      .limit(500),
    hiddenIds(),
  ]);
  return ((data as DbMessage[]) ?? []).filter((m) => !hidden.has(m.id));
}

export async function sendDbMessage(
  userId: string,
  peerId: string,
  text: string,
  extra: { reply_to_id?: string | null; attachment_path?: string; attachment_name?: string; attachment_type?: string } = {},
) {
  return supabase
    .from("messages")
    .insert({ sender_id: userId, receiver_id: peerId, message_text: text, ...extra })
    .select(MSG_COLS)
    .maybeSingle();
}

export async function uploadAttachment(userId: string, file: File) {
  const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
  const path = `${userId}/${crypto.randomUUID()}-${safe}`;
  const { error } = await supabase.storage
    .from("chat-media")
    .upload(path, file, { contentType: file.type || "application/octet-stream" });
  if (error) throw error;
  return path;
}

const urlCache = new Map<string, string>();
export async function attachmentUrl(path: string) {
  if (urlCache.has(path)) return urlCache.get(path)!;
  const { data } = await supabase.storage.from("chat-media").createSignedUrl(path, 3600);
  if (data?.signedUrl) urlCache.set(path, data.signedUrl);
  return data?.signedUrl ?? null;
}

export async function markThreadRead(userId: string, peerId: string) {
  return supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("receiver_id", userId)
    .eq("sender_id", peerId)
    .is("read_at", null);
}

export async function hideMessageForMe(id: string) {
  return supabase.from("message_hidden").insert({ message_id: id });
}

export async function deleteForEveryone(id: string) {
  return supabase.from("messages").update({ deleted_for_everyone: true }).eq("id", id);
}

/** Kept for compatibility (hard delete). */
export async function deleteDbMessage(id: string) {
  return supabase.from("messages").delete().eq("id", id);
}

export async function deleteConversation(userId: string, peerId: string) {
  return supabase
    .from("messages")
    .delete()
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${userId})`,
    );
}

export async function isBlockedByMe(peerId: string) {
  const { data } = await supabase.from("user_blocks").select("blocked_id").eq("blocked_id", peerId).maybeSingle();
  return !!data;
}
export async function blockUser(peerId: string) {
  return supabase.from("user_blocks").insert({ blocked_id: peerId });
}
export async function unblockUser(peerId: string) {
  return supabase.from("user_blocks").delete().eq("blocked_id", peerId);
}
export async function reportUser(peerId: string, reason: string) {
  return supabase.from("user_reports").insert({ reported_id: peerId, reason });
}
