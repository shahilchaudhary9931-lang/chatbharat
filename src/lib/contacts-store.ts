import { useEffect, useState } from "react";
import { contacts as seedContacts, type Contact } from "./mock-data";

const KEY = "cw_contacts";

function load(): Contact[] {
  if (typeof window === "undefined") return seedContacts;
  const raw = localStorage.getItem(KEY);
  if (!raw) return seedContacts;
  try {
    return JSON.parse(raw) as Contact[];
  } catch {
    return seedContacts;
  }
}

function save(list: Contact[]) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("cw_contacts_changed"));
}

export function useContacts() {
  const [list, setList] = useState<Contact[]>(seedContacts);
  useEffect(() => {
    setList(load());
    const h = () => setList(load());
    window.addEventListener("cw_contacts_changed", h);
    return () => window.removeEventListener("cw_contacts_changed", h);
  }, []);
  return list;
}

export function addContact(c: Omit<Contact, "id" | "avatarHue" | "about" | "online"> & Partial<Contact>) {
  const list = load();
  const newContact: Contact = {
    id: "u" + Date.now(),
    name: c.name,
    phone: c.phone,
    avatarHue: c.avatarHue ?? Math.floor(Math.random() * 360),
    about: c.about ?? "Hey there! I am using ChatWave.",
    online: c.online ?? false,
  };
  const next = [newContact, ...list];
  save(next);
  return newContact;
}
