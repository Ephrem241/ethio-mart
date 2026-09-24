import type { Dictionary } from "@/locales/en"

export const order: Dictionary["order"] = {
  status: {
    pending: "በመጠባበቅ ላይ",
    confirmed: "ተረጋግጧል",
    preparing: "በዝግጅት ላይ",
    shipped: "ተልኳል",
    delivered: "ደርሷል",
    cancelled: "ተሰርዟል",
  },
  historyFilter: {
    all: "ሁሉም",
    pending: "በመጠባበቅ ላይ",
    delivered: "የደረሱ",
    cancelled: "የተሰረዙ",
  },
  paymentStatus: {
    pending: "በመጠባበቅ ላይ",
    paid: "ተከፍሏል",
    failed: "አልተሳካም",
  },
  notFound: "ትዕዛዙ አልተገኘም።",
  notFoundText: "ይህን ትዕዛዝ ማግኘት አልቻልንም። የሌላ መለያ ወይም አሳሽ ሊሆን ይችላል።",
  notFoundShort: "ይህን ትዕዛዝ ማግኘት አልቻልንም። የሌላ መለያ ሊሆን ይችላል።",
  viewOrders: "ትዕዛዞችዎን ይመልከቱ",
  back: "ወደ ትዕዛዞች ተመለስ",
  title: "ትዕዛዝ #{number}",
  placed: "የተሰጠው {date}",
  success: {
    title: "ትዕዛዝዎ በተሳካ ሁኔታ ተሰጥቷል።",
    eta: "አብዛኞቹ ትዕዛዞች እንደ ከተማዎ ከ2–5 የሥራ ቀናት ውስጥ ይደርሳሉ።",
    track: "ትዕዛዝ ተከታተል",
    continue: "ግብይት ቀጥል",
  },
  items: {
    title: "ምርቶች",
    qtyLine: "ብዛት {quantity} × {price}",
  },
  address: {
    title: "የማድረሻ አድራሻ",
    notes: "ማስታወሻ፦",
  },
  payment: {
    title: "ክፍያ",
    method: "ዘዴ",
    status: "የክፍያ ሁኔታ",
    subtotal: "ንዑስ ድምር",
    discount: "ቅናሽ",
    delivery: "ማድረስ",
    total: "ጠቅላላ",
  },
  timeline: { title: "የሂደት ታሪክ" },
  errors: {
    invalidStatus: "ሁኔታው ትክክል አይደለም።",
    notFoundOrDenied: "ትዕዛዙ አልተገኘም፣ ወይም ለመቀየር ፈቃድ የለዎትም።",
  },
}
