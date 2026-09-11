import { supabase } from "@/integrations/supabase/client";
import { lookupProfileByEmail } from "@/lib/profile-lookup.functions";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface DbMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  created_at: string;
}

export interface Conversation {
  peerId: string;
  peerName: string;
  lastMessage: string;
  lastAt: string;
}

export async function fetchConversations(userId: string): Promise<Conversation[]> {
  const { data: msgs, error } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, message_text, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error || !msgs) return [];

  const byPeer = new Map<string, DbMessage>();
  for (const m of msgs as DbMessage[]) {
    const peer = m.sender_id === userId ? m.receiver_id : m.sender_id;
    if (!byPeer.has(peer)) byPeer.set(peer, m);
  }
  const peerIds = [...byPeer.keys()];
  if (peerIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, email")
    .in("id", peerIds);

  const nameOf = (id: string) => {
    const p = profiles?.find((x) => x.id === id);
    return p?.username || p?.email || "Unknown";
  };

  return peerIds.map((peerId) => {
    const m = byPeer.get(peerId)!;
    return {
      peerId,
      peerName: nameOf(peerId),
      lastMessage: m.message_text,
      lastAt: m.created_at,
    };
  });
}

export async function fetchThread(userId: string, peerId: string): Promise<DbMessage[]> {
  const { data } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, message_text, created_at")
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${userId})`,
    )
    .order("created_at", { ascending: true })
    .limit(500);
  return (data as DbMessage[]) ?? [];
}

export async function sendDbMessage(userId: string, peerId: string, text: string) {
  return supabase
    .from("messages")
    .insert({ sender_id: userId, receiver_id: peerId, message_text: text })
    .select("id, sender_id, receiver_id, message_text, created_at")
    .maybeSingle();
}

export async function findProfileByEmail(email: string) {
  try {
    return await lookupProfileByEmail({ data: { email } });
  } catch {
    return null;
  }
}
