// Lightweight privacy & security store backed by localStorage.
// Mock implementation — designed for UI demonstration only.

import { useEffect, useState } from "react";

export type Audience = "everyone" | "contacts" | "nobody";

export interface PrivacySettings {
  hidePhone: boolean;
  lastSeen: Audience;
  online: "everyone" | "same-as-last-seen";
  profilePhoto: Audience;
  about: Audience;
  status: Audience;
  readReceipts: boolean;
  typingIndicator: boolean;
  groups: Audience;
  messageFrom: "everyone" | "contacts";
  privateAccount: boolean;
  screenshotProtection: boolean;
  disappearingDefault: "off" | "24h" | "7d" | "90d";
}

export interface SecuritySettings {
  twoStepEnabled: boolean;
  twoStepPin: string | null;
  appLock: "off" | "pin" | "fingerprint" | "face";
  appLockPin: string | null;
  autoLogoutUnknown: boolean;
  e2eeEnabled: boolean;
  secureBackup: boolean;
  spamProtection: boolean;
  fakeAccountDetection: boolean;
  rateLimit: boolean;
}

export interface Device {
  id: string;
  name: string;
  platform: string;
  location: string;
  lastActive: number;
  current: boolean;
  trusted: boolean;
}

export interface Session {
  id: string;
  device: string;
  ip: string;
  location: string;
  startedAt: number;
  current: boolean;
}

export interface BlockedUser {
  id: string;
  name: string;
  phone: string;
  blockedAt: number;
}

const PK = "cw_privacy";
const SK = "cw_security";
const BK = "cw_blocked";
const DK = "cw_devices";
const KK = "cw_sessions";
const HK = "cw_hidden_chats";
const MK = "cw_muted";

const defaultPrivacy: PrivacySettings = {
  hidePhone: false,
  lastSeen: "everyone",
  online: "everyone",
  profilePhoto: "everyone",
  about: "everyone",
  status: "contacts",
  readReceipts: true,
  typingIndicator: true,
  groups: "everyone",
  messageFrom: "everyone",
  privateAccount: false,
  screenshotProtection: false,
  disappearingDefault: "off",
};

const defaultSecurity: SecuritySettings = {
  twoStepEnabled: false,
  twoStepPin: null,
  appLock: "off",
  appLockPin: null,
  autoLogoutUnknown: true,
  e2eeEnabled: true,
  secureBackup: false,
  spamProtection: true,
  fakeAccountDetection: true,
  rateLimit: true,
};

const seedDevices: Device[] = [
  { id: "d1", name: "iPhone 15 Pro", platform: "iOS · ChatWave Mobile", location: "Mumbai, IN", lastActive: Date.now(), current: true, trusted: true },
  { id: "d2", name: "Chrome on MacBook", platform: "Web · macOS", location: "Mumbai, IN", lastActive: Date.now() - 3600_000 * 4, current: false, trusted: true },
  { id: "d3", name: "Unknown Android", platform: "ChatWave Mobile", location: "Pune, IN", lastActive: Date.now() - 3600_000 * 26, current: false, trusted: false },
];

const seedSessions: Session[] = [
  { id: "s1", device: "iPhone 15 Pro", ip: "103.21.•.•", location: "Mumbai, IN", startedAt: Date.now() - 3600_000 * 2, current: true },
  { id: "s2", device: "Chrome · MacBook", ip: "103.21.•.•", location: "Mumbai, IN", startedAt: Date.now() - 86400_000, current: false },
];

function load<T>(k: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(k);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return { ...(fallback as any), ...parsed };
  } catch {
    return fallback;
  }
}
function save<T>(k: string, v: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(k, JSON.stringify(v));
}

export function usePrivacy() {
  const [v, setV] = useState<PrivacySettings>(defaultPrivacy);
  useEffect(() => setV(load(PK, defaultPrivacy)), []);
  const update = (patch: Partial<PrivacySettings>) => {
    const next = { ...v, ...patch };
    setV(next);
    save(PK, next);
  };
  return [v, update] as const;
}

export function useSecurity() {
  const [v, setV] = useState<SecuritySettings>(defaultSecurity);
  useEffect(() => setV(load(SK, defaultSecurity)), []);
  const update = (patch: Partial<SecuritySettings>) => {
    const next = { ...v, ...patch };
    setV(next);
    save(SK, next);
  };
  return [v, update] as const;
}

export function useBlocked() {
  const [list, setList] = useState<BlockedUser[]>([]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try { setList(JSON.parse(localStorage.getItem(BK) || "[]")); } catch {}
  }, []);
  const add = (u: Omit<BlockedUser, "blockedAt">) => {
    const next = [{ ...u, blockedAt: Date.now() }, ...list.filter((b) => b.id !== u.id)];
    setList(next); save(BK, next);
  };
  const remove = (id: string) => {
    const next = list.filter((b) => b.id !== id);
    setList(next); save(BK, next);
  };
  return { list, add, remove };
}

export function useDevices() {
  const [list, setList] = useState<Device[]>([]);
  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(DK) : null;
    if (raw) { try { setList(JSON.parse(raw)); return; } catch {} }
    setList(seedDevices); save(DK, seedDevices);
  }, []);
  const revoke = (id: string) => {
    const next = list.filter((d) => d.id !== id);
    setList(next); save(DK, next);
  };
  const trust = (id: string, trusted: boolean) => {
    const next = list.map((d) => d.id === id ? { ...d, trusted } : d);
    setList(next); save(DK, next);
  };
  return { list, revoke, trust };
}

export function useSessions() {
  const [list, setList] = useState<Session[]>([]);
  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem(KK) : null;
    if (raw) { try { setList(JSON.parse(raw)); return; } catch {} }
    setList(seedSessions); save(KK, seedSessions);
  }, []);
  const end = (id: string) => {
    const next = list.filter((s) => s.id !== id);
    setList(next); save(KK, next);
  };
  const endAllOther = () => {
    const next = list.filter((s) => s.current);
    setList(next); save(KK, next);
  };
  return { list, end, endAllOther };
}

export function useHiddenChats() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    try { setIds(JSON.parse(localStorage.getItem(HK) || "[]")); } catch {}
  }, []);
  const toggle = (id: string) => {
    const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
    setIds(next); save(HK, next);
  };
  return { ids, toggle };
}

export function useMuted() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    try { setIds(JSON.parse(localStorage.getItem(MK) || "[]")); } catch {}
  }, []);
  const toggle = (id: string) => {
    const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
    setIds(next); save(MK, next);
  };
  return { ids, toggle };
}
