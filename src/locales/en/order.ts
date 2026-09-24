// Orders, order status, order history, order pages.
export const order = {
  status: {
    pending: "Pending",
    confirmed: "Confirmed",
    preparing: "Preparing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
  },
  historyFilter: {
    all: "All",
    pending: "Pending",
    delivered: "Delivered",
    cancelled: "Cancelled",
  },
  paymentStatus: {
    pending: "Pending",
    paid: "Paid",
    failed: "Failed",
  },
  notFound: "Order not found.",
  notFoundText: "We couldn't find this order. It may belong to a different account or browser.",
  notFoundShort: "We couldn't find this order. It may belong to a different account.",
  viewOrders: "View your orders",
  back: "Back to orders",
  title: "Order #{number}",
  placed: "Placed {date}",
  success: {
    title: "Order placed successfully.",
    eta: "Most orders are delivered within 2–5 business days, depending on your city.",
    track: "Track order",
    continue: "Continue shopping",
  },
  items: {
    title: "Products",
    qtyLine: "Qty {quantity} × {price}",
  },
  address: {
    title: "Delivery address",
    notes: "Notes:",
  },
  payment: {
    title: "Payment",
    method: "Method",
    status: "Payment status",
    subtotal: "Subtotal",
    discount: "Discount",
    delivery: "Delivery",
    total: "Total",
  },
  timeline: { title: "Timeline" },
  errors: {
    invalidStatus: "Invalid status.",
    notFoundOrDenied: "Order not found, or you don't have permission to change it.",
  },
}
