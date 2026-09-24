import { redirect } from "next/navigation"

// "Deals" in the navigation and footer is the shop filtered to discounted
// products — one listing, not a second page to keep in sync.
export default function DealsPage() {
  redirect("/shop?sale=1")
}
