import type { Dictionary } from "@/locales/en"

export const cart: Dictionary["cart"] = {
  title: "የእርስዎ ጋሪ",
  subtitle: "ከክፍያ በፊት ዕቃዎችዎን ይመልከቱ።",
  emptyTitle: "ጋሪዎ እየጠበቀዎት ነው።",
  emptyText: "ለመጀመር የሚወዱትን ነገር ይጨምሩ።",
  startShopping: "ግብይት ጀምር",
  unavailable: "ይህ ዕቃ ከአሁን በኋላ አይገኝም።",
  remove: "አስወግድ",
  removeItem: "{name}ን ከጋሪ አስወግድ",
  summary: {
    title: "የትዕዛዝ ማጠቃለያ",
    subtotal: "ንዑስ ድምር",
    saving: "የሚቆጥቡት",
    delivery: "ማድረስ",
    calculatedAtCheckout: "በክፍያ ወቅት ይሰላል",
    total: "ጠቅላላ",
    deliveryAdded: "የማድረስ ክፍያ በክፍያ ወቅት ይጨመራል።",
    continue: "ወደ ክፍያ ቀጥል",
    free: "ነፃ",
    freeDeliveryOffer: "ከ{amount} በላይ ለሆኑ ትዕዛዞች ነፃ ማድረስ።",
    freeDeliveryUnlocked: "ነፃ ማድረስ አግኝተዋል!",
  },
  syncFailed: "ጋሪዎን ማመሳሰል አልተቻለም። ለውጦችዎ በዚህ መሣሪያ ላይ ተቀምጠዋል።",
}

export const checkout: Dictionary["checkout"] = {
  title: "ክፍያ",
  subtitle: "የማድረስ እና የክፍያ ዝርዝሮችዎን ይመልከቱ።",
  delivery: {
    title: "የማድረሻ መረጃ",
    fullName: "ሙሉ ስም",
    phone: "ስልክ",
    city: "ከተማ",
    selectCity: "ከተማ ይምረጡ",
    subCity: "ክፍለ ከተማ",
    woreda: "ወረዳ",
    address: "አድራሻ",
    notes: "የማድረስ ማስታወሻ",
  },
  payment: {
    title: "የክፍያ ዘዴ",
    codLabel: "ሲረከቡ በጥሬ ገንዘብ መክፈል",
    codDescription: "ትዕዛዝዎ ሲደርስ በጥሬ ገንዘብ ይክፈሉ።",
    manualLabel: "ሌሎች የክፍያ ዘዴዎች",
    manualDescription: "ቻፓ፣ ቴሌብር እና ሌሎች አቅራቢዎች በቅርቡ ይመጣሉ።",
  },
  review: {
    title: "የትዕዛዝ ግምገማ",
    qty: "ብዛት {count}",
    insufficientStock: "ለ{names} በቂ ክምችት የለም። ለመቀጠል ጋሪዎን ያስተካክሉ።",
    unavailable: "በጋሪዎ ውስጥ ያሉ አንዳንድ ዕቃዎች ከአሁን በኋላ አይገኙም። ለመቀጠል ከጋሪዎ ያስወግዷቸው።",
    placing: "ትዕዛዝ በመስጠት ላይ...",
    place: "ትዕዛዝ ስጥ",
  },
  errors: {
    cartEmpty: "ጋሪዎ ባዶ ነው።",
    unavailable: "በጋሪዎ ውስጥ ያሉ አንዳንድ ዕቃዎች ከአሁን በኋላ አይገኙም። እባክዎ ያስወግዷቸው እና እንደገና ይሞክሩ።",
    insufficientStock: "ለ{names} በቂ ክምችት የለም። እባክዎ በጋሪዎ ውስጥ ያለውን ብዛት ያስተካክሉ እና እንደገና ይሞክሩ።",
    invalidPayment: "ትክክለኛ የክፍያ ዘዴ ይምረጡ።",
    paymentFailed: "ክፍያው ሊከናወን አልቻለም።",
    paymentUnavailable: "ይህ የክፍያ ዘዴ እስካሁን አይገኝም።",
  },
  validation: {
    fullName: "ሙሉ ስምዎን ያስገቡ።",
    city: "ከተማ ይምረጡ።",
    subCity: "ክፍለ ከተማዎን ያስገቡ።",
    woreda: "ወረዳዎን ያስገቡ።",
    address: "የመንገድ አድራሻዎን ያስገቡ።",
    notes: "ማስታወሻ ከ300 ቁምፊዎች ያነሰ ይሁን።",
    paymentMethod: "የክፍያ ዘዴ ይምረጡ።",
  },
}

export const cities: Dictionary["cities"] = {
  addisAbaba: "አዲስ አበባ",
  adama: "አዳማ",
  bahirDar: "ባሕር ዳር",
  hawassa: "ሐዋሳ",
  direDawa: "ድሬ ዳዋ",
  mekelle: "መቀሌ",
  gondar: "ጎንደር",
  jimma: "ጅማ",
  other: "ሌላ",
}

export const errors: Dictionary["errors"] = {
  signInRequired: "ትዕዛዝ ለመስጠት መግባት አለብዎት።",
  invalidQuantity: "ብዛቱ ትክክል አይደለም።",
  addressIncomplete: "የማድረሻ አድራሻው ያልተሟላ ነው።",
  deliveryUnavailable: "ወደዚህ አድራሻ ማድረስ አይቻልም።",
  statusTerminal: "ሁኔታው \"{status}\" የሆነ ትዕዛዝ መቀየር አይቻልም።",
  sameStatus: "ትዕዛዙ አስቀድሞ በዚህ ሁኔታ ላይ ነው።",
  notAllowed: "ይህን ለማድረግ ፈቃድ የለዎትም።",
}
