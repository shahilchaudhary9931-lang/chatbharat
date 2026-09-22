import { useCallback, useEffect, useState } from "react";

const KEY = "cw_contact_names";
const EVENT = "cw_contact_names_changed";

type NameMap = Record<string, string>;

function load(): NameMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as NameMap) : {};
  } catch {
    return {};
  }
}

export function setContactName(peerId: string, name: string) {
  const map = load();
  const trimmed = name.trim();
  if (trimmed) map[peerId] = trimmed;
  else delete map[peerId];
  localStorage.setItem(KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent(EVENT));
}

/** Locally saved custom names, keyed by the other person's profile id. */
export function useContactNames() {
  const [map, setMap] = useState<NameMap>({});

  useEffect(() => {
    setMap(load());
    const h = () => setMap(load());
    window.addEventListener(EVENT, h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener(EVENT, h);
      window.removeEventListener("storage", h);
    };
  }, []);

  const displayName = useCallback(
    (peerId: string, fallback: string) => map[peerId] || fallback,
    [map],
  );

  return { names: map, displayName, setContactName };
}
