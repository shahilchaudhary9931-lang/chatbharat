import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "hi";

const dict = {
  en: {
    appName: "ChatWave",
    tagline: "Simple. Secure. Reliable messaging.",
    from: "from",
    continue: "Continue",
    enterPhone: "Enter your phone number",
    phoneHelp: "We'll send you a one-time code to verify.",
    phonePlaceholder: "98765 43210",
    next: "Next",
    verify: "Verify",
    otpTitle: "Verify your number",
    otpSubtitle: "Enter the 6-digit code sent to",
    resend: "Resend code",
    chats: "Chats",
    status: "Status",
    calls: "Calls",
    searchPlaceholder: "Search or start new chat",
    online: "online",
    typing: "typing…",
    lastSeen: "last seen today at",
    newGroup: "New group",
    newChat: "New chat",
    profile: "Profile",
    settings: "Settings",
    logout: "Log out",
    yourName: "Your name",
    about: "About",
    aboutDefault: "Hey there! I am using ChatWave.",
    typeMessage: "Type a message",
    send: "Send",
    today: "Today",
    yesterday: "Yesterday",
    myStatus: "My status",
    tapToAdd: "Tap to add status update",
    recentUpdates: "Recent updates",
    selectContacts: "Select contacts",
    createGroup: "Create group",
    groupName: "Group name",
    participants: "participants",
    darkMode: "Dark mode",
    language: "Language",
    notifications: "Notifications",
    privacy: "Privacy",
    help: "Help",
    sent: "Sent",
    delivered: "Delivered",
    seen: "Seen",
    photo: "Photo",
    video: "Video",
    voice: "Voice message",
    missedCall: "Missed voice call",
    incoming: "Incoming",
    outgoing: "Outgoing",
    welcomeBack: "Welcome back",
    enterCode: "Enter code",
    didntGet: "Didn't receive the code?",
    changeNumber: "Change number",
    reply: "Reply",
    forward: "Forward",
    deleteMsg: "Delete",
    star: "Star",
    unstar: "Unstar",
    copy: "Copy",
    cancel: "Cancel",
    starredMessages: "Starred",
    forwardTo: "Forward to",
    deleteForMe: "Delete for me",
    deleteForEveryone: "Delete for everyone",
    messageDeleted: "🚫 This message was deleted",
    searchInChat: "Search in chat",
    noResults: "No results",
    replyingTo: "Replying to",
    available: "Available",
    busy: "Busy",
    atWork: "At work",
    sleeping: "Sleeping",
    inMeeting: "In a meeting",
    batteryLow: "Battery about to die",
  },
  hi: {
    appName: "चैटवेव",
    tagline: "सरल. सुरक्षित. भरोसेमंद मैसेजिंग.",
    from: "द्वारा",
    continue: "जारी रखें",
    enterPhone: "अपना फ़ोन नंबर डालें",
    phoneHelp: "हम सत्यापन के लिए एक OTP भेजेंगे.",
    phonePlaceholder: "98765 43210",
    next: "आगे",
    verify: "सत्यापित करें",
    otpTitle: "अपना नंबर सत्यापित करें",
    otpSubtitle: "6 अंकों का कोड भेजा गया",
    resend: "कोड फिर भेजें",
    chats: "चैट",
    status: "स्टेटस",
    calls: "कॉल",
    searchPlaceholder: "खोजें या नई चैट शुरू करें",
    online: "ऑनलाइन",
    typing: "टाइप कर रहे हैं…",
    lastSeen: "आज अंतिम बार देखा",
    newGroup: "नया ग्रुप",
    newChat: "नई चैट",
    profile: "प्रोफ़ाइल",
    settings: "सेटिंग्स",
    logout: "लॉग आउट",
    yourName: "आपका नाम",
    about: "के बारे में",
    aboutDefault: "नमस्ते! मैं चैटवेव उपयोग कर रहा हूँ.",
    typeMessage: "संदेश लिखें",
    send: "भेजें",
    today: "आज",
    yesterday: "कल",
    myStatus: "मेरा स्टेटस",
    tapToAdd: "स्टेटस अपडेट जोड़ने के लिए टैप करें",
    recentUpdates: "हाल के अपडेट",
    selectContacts: "संपर्क चुनें",
    createGroup: "ग्रुप बनाएँ",
    groupName: "ग्रुप का नाम",
    participants: "सदस्य",
    darkMode: "डार्क मोड",
    language: "भाषा",
    notifications: "सूचनाएँ",
    privacy: "गोपनीयता",
    help: "मदद",
    sent: "भेजा गया",
    delivered: "डिलीवर हुआ",
    seen: "देखा गया",
    photo: "फ़ोटो",
    video: "वीडियो",
    voice: "वॉइस मैसेज",
    missedCall: "मिस्ड कॉल",
    incoming: "इनकमिंग",
    outgoing: "आउटगोइंग",
    welcomeBack: "वापसी पर स्वागत है",
    enterCode: "कोड दर्ज करें",
    didntGet: "कोड नहीं मिला?",
    changeNumber: "नंबर बदलें",
    reply: "जवाब दें",
    forward: "फॉरवर्ड",
    deleteMsg: "हटाएँ",
    star: "स्टार",
    unstar: "अनस्टार",
    copy: "कॉपी",
    cancel: "रद्द करें",
    starredMessages: "स्टार किए गए",
    forwardTo: "किसको फॉरवर्ड करें",
    deleteForMe: "मेरे लिए हटाएँ",
    deleteForEveryone: "सबके लिए हटाएँ",
    messageDeleted: "🚫 यह संदेश हटा दिया गया",
    searchInChat: "चैट में खोजें",
    noResults: "कोई परिणाम नहीं",
    replyingTo: "जवाब दे रहे हैं",
    available: "उपलब्ध",
    busy: "व्यस्त",
    atWork: "काम पर",
    sleeping: "सो रहा हूँ",
    inMeeting: "मीटिंग में",
    batteryLow: "बैटरी ख़त्म होने वाली है",
  },
} as const;

type Key = keyof typeof dict.en;

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: Key) => string;
}

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("cw_lang")) as Lang | null;
    if (saved === "en" || saved === "hi") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("cw_lang", l);
  };

  const t = (k: Key) => dict[lang][k] ?? dict.en[k];

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
