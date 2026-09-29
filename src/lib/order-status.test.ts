import { describe, expect, it } from "vitest"

import { createTranslator } from "@/lib/i18n/translator"
import {
  ORDER_HISTORY_FILTERS,
  allowedNextStatuses,
  statusMenuOptions,
  ORDER_STATUSES,
  getOrderStatusMeta,
  matchesOrderHistoryFilter,
  type OrderHistoryFilter,
} from "@/lib/order-status"
import type { OrderStatus } from "@/lib/types/orders"
import { en } from "@/locales/en"

const t = createTranslator("en", en)

describe("order statuses", () => {
  it("lists every status once, in the order an order moves through them", () => {
    expect(ORDER_STATUSES).toEqual(["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"])
  })

  it("has a label in the dictionary for each status", () => {
    for (const status of ORDER_STATUSES) {
      expect(getOrderStatusMeta(status, t).label).toBe(en.order.status[status])
    }
  })

  it("colours pending as a warning, delivered as success and cancelled as an error", () => {
    expect(getOrderStatusMeta("pending", t).className).toContain("text-warning-text")
    expect(getOrderStatusMeta("delivered", t).className).toContain("text-success")
    expect(getOrderStatusMeta("cancelled", t).className).toContain("text-error")
  })

  it("shows the in-between statuses neutrally", () => {
    for (const status of ["confirmed", "preparing", "shipped"] as const) {
      expect(getOrderStatusMeta(status, t).className).toContain("bg-secondary")
    }
  })
})

describe("order history filter", () => {
  // filter -> the statuses it must include
  const expected: Record<OrderHistoryFilter, OrderStatus[]> = {
    all: ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"],
    pending: ["pending", "confirmed", "preparing", "shipped"], // "not resolved yet"
    delivered: ["delivered"],
    cancelled: ["cancelled"],
  }

  it.each(ORDER_HISTORY_FILTERS)("'%s' matches exactly the statuses it should", (filter) => {
    const matching = ORDER_STATUSES.filter((status) => matchesOrderHistoryFilter(status, filter))
    expect(matching).toEqual(expected[filter])
  })

  it("puts every order in exactly one of the three specific filters", () => {
    for (const status of ORDER_STATUSES) {
      const hits = (["pending", "delivered", "cancelled"] as const).filter((f) => matchesOrderHistoryFilter(status, f))
      expect(hits).toHaveLength(1)
    }
  })
})

describe("allowedNextStatuses (mirrors the database rule, migration 0018)", () => {
  it("moves forward only, skipping allowed, and can always cancel an open order", () => {
    expect(allowedNextStatuses("pending")).toEqual(["confirmed", "preparing", "shipped", "delivered", "cancelled"])
    expect(allowedNextStatuses("confirmed")).toEqual(["preparing", "shipped", "delivered", "cancelled"])
    expect(allowedNextStatuses("preparing")).toEqual(["shipped", "delivered", "cancelled"])
    expect(allowedNextStatuses("shipped")).toEqual(["delivered", "cancelled"])
  })

  it("never offers a step backwards", () => {
    for (const status of ORDER_STATUSES) {
      const at = ORDER_STATUSES.indexOf(status)
      for (const next of allowedNextStatuses(status)) {
        expect(next === "cancelled" || ORDER_STATUSES.indexOf(next) > at).toBe(true)
      }
    }
  })

  it("delivered and cancelled are final", () => {
    expect(allowedNextStatuses("delivered")).toEqual([])
    expect(allowedNextStatuses("cancelled")).toEqual([])
  })

  it("the admin menu lists the current status first, then the next steps", () => {
    expect(statusMenuOptions("shipped")).toEqual(["shipped", "delivered", "cancelled"])
    expect(statusMenuOptions("delivered")).toEqual(["delivered"])
  })
})
