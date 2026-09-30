// Asks the server to send what the database just queued (an order
// confirmation, a status update, a contact message): see
// app/api/email/dispatch/route.ts. Fire and forget: `keepalive` lets the
// request finish even if the page navigates away right after, and nothing the
// shopper or admin did depends on it succeeding. An email a failed ping didn't
// send stays queued and goes out with the next one.
export function requestEmailDispatch(body?: { orderId: string; locale: string }): void {
  if (typeof fetch === "undefined") return
  try {
    void fetch("/api/email/dispatch", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    }).catch(() => {})
  } catch {
    // Never let a notification ping break the action that caused it.
  }
}
