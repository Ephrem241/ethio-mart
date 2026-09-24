// Cart, checkout, delivery cities and the messages the database can send back.
export const cart = {
  title: "Your Cart",
  subtitle: "Review your items before checkout.",
  emptyTitle: "Your cart is waiting.",
  emptyText: "Add something you love to get started.",
  startShopping: "Start shopping",
  unavailable: "This item is no longer available.",
  remove: "Remove",
  removeItem: "Remove {name} from cart",
  summary: {
    title: "Order summary",
    subtotal: "Subtotal",
    saving: "You're saving",
    delivery: "Delivery",
    calculatedAtCheckout: "Calculated at checkout",
    total: "Total",
    deliveryAdded: "Delivery is added at checkout.",
    continue: "Continue to checkout",
    free: "Free",
    // {amount} is an already-formatted price. "Over" means strictly above it.
    freeDeliveryOffer: "Free delivery on orders over {amount}.",
    freeDeliveryUnlocked: "You've unlocked free delivery!",
  },
  syncFailed: "Couldn't sync your cart. Your changes are saved on this device.",
}

export const checkout = {
  title: "Checkout",
  subtitle: "Review your delivery and payment details.",
  delivery: {
    title: "Delivery information",
    fullName: "Full name",
    phone: "Phone",
    city: "City",
    selectCity: "Select a city",
    subCity: "Sub-city",
    woreda: "Woreda",
    address: "Address",
    notes: "Delivery notes",
  },
  payment: {
    title: "Payment method",
    codLabel: "Cash on Delivery",
    codDescription: "Pay in cash when your order arrives.",
    manualLabel: "Other payment methods",
    manualDescription: "Chapa, Telebirr, and other providers are coming soon.",
  },
  review: {
    title: "Order review",
    qty: "Qty {count}",
    insufficientStock: "Not enough stock for {names}. Update your cart to continue.",
    unavailable: "Some items in your cart are no longer available. Remove them from your cart to continue.",
    placing: "Placing order...",
    place: "Place order",
  },
  errors: {
    cartEmpty: "Your cart is empty.",
    unavailable: "Some items in your cart are no longer available. Please remove them and try again.",
    insufficientStock: "Not enough stock for: {names}. Please update the quantity in your cart and try again.",
    invalidPayment: "Select a valid payment method.",
    paymentFailed: "Payment could not be processed.",
    paymentUnavailable: "This payment method isn't available yet.",
  },
  validation: {
    fullName: "Enter your full name.",
    city: "Select a city.",
    subCity: "Enter your sub-city.",
    woreda: "Enter your woreda.",
    address: "Enter your street address.",
    notes: "Keep notes under 300 characters.",
    paymentMethod: "Select a payment method.",
  },
}

// Delivery cities are stored in orders and addresses by their English name
// (that is what the delivery_fees table is keyed on); these are only the
// names shown to people.
export const cities = {
  addisAbaba: "Addis Ababa",
  adama: "Adama",
  bahirDar: "Bahir Dar",
  hawassa: "Hawassa",
  direDawa: "Dire Dawa",
  mekelle: "Mekelle",
  gondar: "Gondar",
  jimma: "Jimma",
  other: "Other",
}

// The database's own exception messages (order placement, status changes)
// arrive in English; db-errors.ts maps each one to one of these.
export const errors = {
  signInRequired: "You must be signed in to place an order.",
  invalidQuantity: "Invalid quantity.",
  addressIncomplete: "Delivery address is incomplete.",
  deliveryUnavailable: "Delivery is not available for this address.",
  statusTerminal: "Cannot change the status of an order that is already \"{status}\".",
  sameStatus: "Order is already in this status.",
  notAllowed: "You don't have permission to do that.",
}
