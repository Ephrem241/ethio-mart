// The store's emails (src/lib/email/templates.ts): the customer's order
// confirmation and status updates in their language, and the owner's
// new-order alert and contact-form messages (always sent in English).
export const email = {
  greeting: "Hello {name},",
  signoff: "Thank you for shopping with {brand}.",
  footer: "This email was sent by {brand}.",
  viewOrder: "View your order",
  orderNumber: "Order number",
  item: "Item",
  quantity: "Qty",
  amount: "Amount",
  subtotal: "Subtotal",
  delivery: "Delivery",
  free: "Free",
  discount: "Discount",
  total: "Total",
  deliverTo: "Delivery address",
  payment: "Payment",
  cod: "Cash on delivery",
  confirmation: {
    subject: "Order {number} received — {brand}",
    heading: "We've received your order",
    intro:
      "Thank you! Your order {number} is in. We'll email you as it moves along. You pay in cash when it arrives.",
  },
  status: {
    subject: "Order {number}: {status}",
    heading: "Order update: {status}",
    confirmed: "Good news — we've confirmed your order {number} and are getting it ready.",
    shipped: "Your order {number} is on its way. Please have the cash ready when it arrives.",
    delivered: "Your order {number} has been delivered. We hope you enjoy it!",
    cancelled: "Your order {number} has been cancelled. If you didn't expect this, please contact us.",
  },
  alert: {
    subject: "New order {number} — {total}",
    heading: "New order",
    intro: "{name} ({email}) placed order {number}.",
    open: "Open it in the admin",
  },
  // The admin's answer to a contact-form message, to the customer.
  reply: {
    subject: "Re: {subject}",
    subjectFallback: "Your message to {brand}",
    heading: "A reply to your message",
    quoteLabel: "Your message",
  },
  contact: {
    subject: "Contact form: {subject}",
    noSubject: "(no subject)",
    heading: "New message from the contact form",
    from: "From",
    replyHint: "Reply to this email to answer {name} directly.",
  },
}
