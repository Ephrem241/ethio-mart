// The information pages linked from the footer: contact, delivery, returns,
// FAQ, about, privacy, terms. Written from what the store actually does — cash
// on delivery, per-city delivery fees, the order statuses, the cookies and
// browser storage the app really uses — and it states no figure (a return
// window, a delivery time) that the shop has not set. The privacy policy and
// terms are plain-language DRAFTS: the owner (ideally with a lawyer) should
// review them before launch.
export const info = {
  common: {
    lastUpdated: "Last updated: {date}",
    questions: "Questions?",
    contactLink: "Contact us",
    faqLink: "Read the FAQ",
    ordersLink: "Go to my orders",
    startShopping: "Start shopping",
  },
  contact: {
    title: "Contact Us",
    subtitle: "We're happy to help with your orders, deliveries and any questions.",
    email: "Email",
    phone: "Phone",
    address: "Address",
    hours: "Support hours",
    notSet:
      "Our contact details are being set up and will appear here soon. In the meantime you can find answers in our FAQ, and follow your orders from your account.",
    orderHelpTitle: "Asking about an order?",
    // {example} is a sample order number in the real format.
    orderHelpText: "Have your order number ready — it looks like {example}. You'll find it under Account → Orders.",
  },
  delivery: {
    title: "Delivery Information",
    subtitle: "How we deliver your orders, and what it costs.",
    whereTitle: "Where we deliver",
    whereText:
      "We deliver to the cities listed below, and to other places at the standard rate. At checkout you enter your city, sub-city, woreda and street address.",
    feesTitle: "Delivery fees",
    feesCaption: "Delivery fee by city",
    city: "City",
    fee: "Fee",
    otherPlaces: "All other places",
    feesNote: "The fee for your order is shown at checkout, before you place it.",
    // {amount} is an already-formatted price. "Over" means strictly above it.
    freeText: "Orders over {amount} are delivered free.",
    payTitle: "Payment on delivery",
    payText: "For now you pay in cash when your order arrives. More payment methods will be added later.",
    afterTitle: "After you order",
    afterText:
      "Most orders are prepared and dispatched within a few business days. Follow the status of your order — pending, confirmed, preparing, shipped, delivered — in Account → Orders.",
    tipTitle: "So your order finds you",
    tipText:
      "Please give a phone number you can answer and a clear address, with your sub-city and woreda, so your order reaches you.",
  },
  returns: {
    title: "Returns",
    subtitle: "If something isn't right with your order, we want to hear about it.",
    checkTitle: "Before you contact us",
    checkText: "Look at your order under Account → Orders to see its status and what it contains.",
    problemTitle: "Wrong, damaged or faulty items",
    problemText:
      "If your order arrives damaged, faulty, or not what you ordered, contact us as soon as you notice.",
    windowTitle: "Time limit",
    // {days} is set by the shop; when it isn't, no number is promised.
    windowText: "Return requests are accepted within {days} days of delivery.",
    windowNone:
      "Please contact us as soon as you notice a problem. We look at each request individually.",
    howTitle: "How to return an item",
    howText:
      "Contact us with your order number and a short description (a photo helps). We'll tell you how to send the item back and what happens next.",
    refundTitle: "Refunds and replacements",
    refundText: "Where a return is accepted, we'll arrange a refund or a replacement with you.",
  },
  faq: {
    title: "Frequently Asked Questions",
    subtitle: "Quick answers about ordering, delivery and your account.",
    q1: "Do I need an account to shop?",
    a1: "No. You can browse, search and fill your cart without one. You sign in (or register) when you're ready to place an order, so we can keep track of it for you.",
    q2: "How do I place an order?",
    a2: "Add products to your cart, open the cart, choose “Continue to checkout”, enter your delivery details and place the order.",
    q3: "How do I pay?",
    a3: "For now you pay in cash when your order arrives. Other payment methods will be added later.",
    q4: "How much is delivery?",
    a4: "It depends on your city — see Delivery Information for the current fees.",
    q5: "How can I follow my order?",
    a5: "Sign in and open Account → Orders. Each order shows its status: pending, confirmed, preparing, shipped or delivered.",
    q6: "Can I change or cancel an order?",
    a6: "Contact us as soon as possible with your order number. Orders that have not been prepared yet are the easiest to change.",
    q7: "What if my item arrives damaged or wrong?",
    a7: "See Returns for what to do.",
    q8: "Is the store available in Amharic?",
    a8: "Yes. Use the language switch in the header or the footer to move between English and አማርኛ; your choice is remembered.",
    q9: "How is my information protected?",
    a9: "We only ask for what we need to deliver your order. Read our Privacy Policy for the details.",
    moreTitle: "Still have a question?",
    moreText: "We're happy to help.",
  },
  about: {
    title: "About Us",
    // {brand} is the store name.
    subtitle: "{brand} is your trusted destination for quality products in Ethiopia.",
    whatTitle: "What we do",
    whatText:
      "We bring everyday products for your home, kitchen, family and lifestyle together in one place, so you can find what you need, see the price in birr, and have it delivered to your door.",
    howTitle: "How shopping works",
    howText:
      "Browse or search, add to your cart, and check out with your delivery details. You pay in cash when your order arrives.",
    findTitle: "What you'll find",
    languageTitle: "In your language",
    languageText: "The whole store works in English and Amharic.",
  },
  privacy: {
    title: "Privacy Policy",
    subtitle: "What personal information we collect, why we collect it, and the choices you have.",
    whoTitle: "Who we are",
    whoText:
      "{brand} runs this online store. This page explains what personal information we collect, why, and what choices you have. If you have questions, see Contact Us.",
    collectTitle: "What we collect",
    collectIntro: "We collect only what we need to deliver your order and manage your account:",
    collect1:
      "Account details: your name, your email address and a password (kept securely by our sign-in provider — we cannot read it). If you sign in with Google, we receive your name and email from Google.",
    collect2: "Order details: your delivery name, phone number and address, what you ordered, and how you paid.",
    collect3: "Saved items: your cart, favorites and saved addresses.",
    collect4: "Newsletter: the email address you give us, if you subscribe.",
    collect5: "Preferences on your device: your language choice and your recent searches.",
    useTitle: "How we use it",
    useText:
      "To create and manage your account; to prepare, deliver and support your orders; to remember your cart and favorites; to send you our newsletter if you subscribed; and to keep the store secure and working.",
    storageTitle: "Cookies and local storage",
    storageText:
      "We use a small cookie to remember your language, and cookies from our sign-in provider to keep you signed in. Your cart, favorites and recent searches are kept in your browser's storage on your device (and saved to your account when you're signed in). We don't use advertising trackers.",
    shareTitle: "Who can see it",
    shareText:
      "Only the people who run the store, and the couriers who deliver your order, see your delivery details. The services that store our data and host this website process it on our behalf. We don't sell your personal information.",
    keepTitle: "How long we keep it",
    keepText:
      "We keep your account and order records for as long as we need them to provide the service and meet our legal obligations. You can ask us to delete your account.",
    choicesTitle: "Your choices",
    choicesText:
      "You can update your name and phone number under Account → Profile and manage your saved addresses there. To unsubscribe from the newsletter, or to see, correct or delete your information, contact us.",
    changesTitle: "Changes",
    changesText: "We may update this policy; the date above shows the latest version.",
  },
  terms: {
    title: "Terms & Conditions",
    subtitle: "The rules that apply when you use {brand}.",
    useTitle: "Using this site",
    useText:
      "By using {brand} or placing an order you agree to these terms. If you don't agree, please don't use the site.",
    accountTitle: "Your account",
    accountText:
      "Keep your sign-in details private and give accurate information. You are responsible for activity on your account.",
    productsTitle: "Products and prices",
    productsText:
      "Prices are shown in Ethiopian birr (ETB). We do our best to keep descriptions, photos, prices and stock accurate; if something is wrong we may correct it or cancel an affected order. Photos are for illustration.",
    ordersTitle: "Orders",
    ordersText:
      "Placing an order is a request to buy. We confirm it on your Orders page when we accept it, and an order may be declined if items are unavailable or the details are incomplete.",
    payTitle: "Payment and delivery",
    payText:
      "You pay in cash when your order is delivered. Delivery fees are shown at checkout before you order — see Delivery Information. Delivery times are estimates.",
    returnsTitle: "Returns",
    returnsText: "See Returns for how we handle problems with an order.",
    conductTitle: "Acceptable use",
    conductText:
      "Don't misuse the site: don't try to break or overload it, don't access other people's accounts or data, and don't place orders you don't intend to receive.",
    contentTitle: "Our content",
    contentText:
      "The text, photos and design of this site belong to {brand} or its licensors and may not be copied without permission.",
    liabilityTitle: "Liability",
    liabilityText:
      "We provide the site and products with reasonable care. To the extent the law allows, we are not liable for losses that could not reasonably have been foreseen, or for delays outside our control.",
    changesTitle: "Changes and governing law",
    changesText:
      "We may update these terms; the date above shows the latest version. These terms are governed by the laws of Ethiopia.",
  },
}
