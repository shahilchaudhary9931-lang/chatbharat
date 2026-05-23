export type MsgStatus = "sent" | "delivered" | "seen";
export type MsgKind = "text" | "photo" | "voice" | "video";

export interface Message {
  id: string;
  fromMe: boolean;
  kind: MsgKind;
  text?: string;
  durationSec?: number;
  time: string; // HH:mm
  status?: MsgStatus;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  avatarHue: number;
  about: string;
  online: boolean;
  lastSeen?: string;
}

export interface Chat {
  id: string;
  contactId: string;
  name: string;
  avatarHue: number;
  isGroup?: boolean;
  members?: string[];
  lastMessage: string;
  lastTime: string;
  unread: number;
  pinned?: boolean;
  muted?: boolean;
  typing?: boolean;
  messages: Message[];
}

export interface Story {
  id: string;
  name: string;
  avatarHue: number;
  time: string;
  viewed?: boolean;
  caption?: string;
}

export interface Call {
  id: string;
  name: string;
  avatarHue: number;
  type: "voice" | "video";
  direction: "incoming" | "outgoing" | "missed";
  time: string;
}

export const contacts: Contact[] = [
  { id: "c1", name: "Aarav Sharma", phone: "+91 98201 11111", avatarHue: 12, about: "Busy", online: true },
  { id: "c2", name: "Priya Verma", phone: "+91 98202 22222", avatarHue: 320, about: "नमस्ते 🙏", online: false, lastSeen: "10:42 AM" },
  { id: "c3", name: "Rahul Khanna", phone: "+91 98203 33333", avatarHue: 200, about: "At the gym", online: true },
  { id: "c4", name: "Sneha Iyer", phone: "+91 98204 44444", avatarHue: 280, about: "Available", online: false, lastSeen: "yesterday" },
  { id: "c5", name: "Mom ❤️", phone: "+91 98205 55555", avatarHue: 0, about: "Call me anytime", online: true },
  { id: "c6", name: "Vikram Singh", phone: "+91 98206 66666", avatarHue: 145, about: "Travelling ✈️", online: false, lastSeen: "9:01 AM" },
  { id: "c7", name: "Ananya Gupta", phone: "+91 98207 77777", avatarHue: 50, about: "Coffee & code ☕", online: true },
  { id: "c8", name: "Rohan Mehta", phone: "+91 98208 88888", avatarHue: 100, about: "Sleeping 😴", online: false, lastSeen: "2:14 AM" },
];

export const chats: Chat[] = [
  {
    id: "ch1", contactId: "c1", name: "Aarav Sharma", avatarHue: 12,
    lastMessage: "Bhai kal milte hain? ☕", lastTime: "10:42", unread: 2, pinned: true,
    messages: [
      { id: "m1", fromMe: false, kind: "text", text: "Hey! कैसे हो?", time: "10:40" },
      { id: "m2", fromMe: true, kind: "text", text: "Sab badhiya 😄 tum batao", time: "10:41", status: "seen" },
      { id: "m3", fromMe: false, kind: "text", text: "Bhai kal milte hain? ☕", time: "10:42" },
      { id: "m4", fromMe: false, kind: "voice", durationSec: 14, time: "10:42" },
    ],
  },
  {
    id: "ch2", contactId: "c2", name: "Priya Verma", avatarHue: 320,
    lastMessage: "📷 Photo", lastTime: "09:58", unread: 0, typing: true,
    messages: [
      { id: "m1", fromMe: false, kind: "text", text: "Good morning ☀️", time: "09:55" },
      { id: "m2", fromMe: true, kind: "text", text: "Subah ki chai ho gayi?", time: "09:56", status: "delivered" },
      { id: "m3", fromMe: false, kind: "photo", text: "🌅", time: "09:58" },
    ],
  },
  {
    id: "ch3", contactId: "", name: "Office Team 🏢", avatarHue: 220, isGroup: true,
    members: ["c3", "c4", "c7", "c8"],
    lastMessage: "Rahul: Meeting at 3pm", lastTime: "09:30", unread: 5,
    messages: [
      { id: "m1", fromMe: false, kind: "text", text: "Standup में सब आ रहे हैं?", time: "09:20" },
      { id: "m2", fromMe: true, kind: "text", text: "Yes, joining in 5", time: "09:22", status: "seen" },
      { id: "m3", fromMe: false, kind: "text", text: "Meeting at 3pm", time: "09:30" },
    ],
  },
  {
    id: "ch4", contactId: "c5", name: "Mom ❤️", avatarHue: 0,
    lastMessage: "Khana kha liya?", lastTime: "Yesterday", unread: 0,
    messages: [
      { id: "m1", fromMe: false, kind: "text", text: "बेटा, खाना खा लिया?", time: "21:10" },
      { id: "m2", fromMe: true, kind: "text", text: "Haan maa, abhi khaya", time: "21:12", status: "seen" },
    ],
  },
  {
    id: "ch5", contactId: "c6", name: "Vikram Singh", avatarHue: 145,
    lastMessage: "🎥 Video", lastTime: "Yesterday", unread: 0,
    messages: [
      { id: "m1", fromMe: false, kind: "video", text: "Goa trip 🏖️", time: "18:20" },
    ],
  },
  {
    id: "ch6", contactId: "c7", name: "Ananya Gupta", avatarHue: 50,
    lastMessage: "Thanks! 🙌", lastTime: "Tue", unread: 0, muted: true,
    messages: [
      { id: "m1", fromMe: true, kind: "text", text: "Sent the design files", time: "14:00", status: "seen" },
      { id: "m2", fromMe: false, kind: "text", text: "Thanks! 🙌", time: "14:05" },
    ],
  },
];

export const stories: Story[] = [
  { id: "s1", name: "Aarav Sharma", avatarHue: 12, time: "20 min ago" },
  { id: "s2", name: "Sneha Iyer", avatarHue: 280, time: "1 h ago", caption: "Sunset vibes 🌇" },
  { id: "s3", name: "Rahul Khanna", avatarHue: 200, time: "3 h ago" },
  { id: "s4", name: "Ananya Gupta", avatarHue: 50, time: "5 h ago", viewed: true },
  { id: "s5", name: "Vikram Singh", avatarHue: 145, time: "8 h ago", viewed: true },
];

export const calls: Call[] = [
  { id: "k1", name: "Aarav Sharma", avatarHue: 12, type: "voice", direction: "outgoing", time: "Today, 10:30" },
  { id: "k2", name: "Mom ❤️", avatarHue: 0, type: "video", direction: "incoming", time: "Today, 09:12" },
  { id: "k3", name: "Priya Verma", avatarHue: 320, type: "voice", direction: "missed", time: "Yesterday, 22:40" },
  { id: "k4", name: "Office Team 🏢", avatarHue: 220, type: "video", direction: "outgoing", time: "Yesterday, 15:00" },
  { id: "k5", name: "Rahul Khanna", avatarHue: 200, type: "voice", direction: "incoming", time: "Mon, 11:05" },
];

export function getChat(id: string) {
  return chats.find((c) => c.id === id);
}
