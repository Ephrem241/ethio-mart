import type { Dictionary } from "@/locales/en"

export const email: Dictionary["email"] = {
  greeting: "ሰላም {name}፣",
  signoff: "{brand}ን ስለመረጡ እናመሰግናለን።",
  footer: "ይህ ኢሜይል የተላከው ከ{brand} ነው።",
  viewOrder: "ትዕዛዝዎን ይመልከቱ",
  orderNumber: "የትዕዛዝ ቁጥር",
  item: "ዕቃ",
  quantity: "ብዛት",
  amount: "ዋጋ",
  subtotal: "ንዑስ ድምር",
  delivery: "የማድረሻ ክፍያ",
  free: "ነፃ",
  discount: "ቅናሽ",
  total: "ጠቅላላ",
  deliverTo: "የማድረሻ አድራሻ",
  payment: "ክፍያ",
  cod: "ሲደርስ በጥሬ ገንዘብ",
  confirmation: {
    subject: "ትዕዛዝ {number} ደርሶናል — {brand}",
    heading: "ትዕዛዝዎ ደርሶናል",
    intro: "እናመሰግናለን! ትዕዛዝ {number} ተቀብለናል። ሁኔታው ሲቀየር በኢሜይል እናሳውቅዎታለን። ክፍያው ዕቃው ሲደርስ በጥሬ ገንዘብ ይፈጸማል።",
  },
  status: {
    subject: "ትዕዛዝ {number}፦ {status}",
    heading: "የትዕዛዝ ሁኔታ፦ {status}",
    confirmed: "መልካም ዜና — ትዕዛዝ {number}ን አረጋግጠናል፤ እያዘጋጀነው ነው።",
    shipped: "ትዕዛዝ {number} በመንገድ ላይ ነው። ሲደርስ ክፍያውን በጥሬ ገንዘብ ያዘጋጁ።",
    delivered: "ትዕዛዝ {number} ደርሷል። እንደሚወዱት ተስፋ እናደርጋለን!",
    cancelled: "ትዕዛዝ {number} ተሰርዟል። ይህን ካልጠበቁ እባክዎ ያግኙን።",
  },
  alert: {
    subject: "አዲስ ትዕዛዝ {number} — {total}",
    heading: "አዲስ ትዕዛዝ",
    intro: "{name} ({email}) ትዕዛዝ {number} አስገብተዋል።",
    open: "በአስተዳዳሪ ገጽ ይክፈቱ",
  },
  reply: {
    // "Re:" stays as it is, so mail apps keep the conversation together.
    subject: "Re: {subject}",
    subjectFallback: "ለ{brand} የላኩት መልእክት",
    heading: "ለመልእክትዎ የተሰጠ መልስ",
    quoteLabel: "የእርስዎ መልእክት",
  },
  contact: {
    subject: "የመገናኛ ቅጽ፦ {subject}",
    noSubject: "(ርዕስ የለም)",
    heading: "ከመገናኛ ቅጹ አዲስ መልእክት",
    from: "ላኪ",
    replyHint: "{name}ን በቀጥታ ለመመለስ ለዚህ ኢሜይል ምላሽ ይስጡ።",
  },
}
