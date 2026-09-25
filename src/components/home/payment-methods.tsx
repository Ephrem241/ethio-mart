import { Banknote } from "lucide-react"
import { cn } from "cn"

import { getT } from "@/lib/i18n/server"
import { cashOnDeliveryProvider } from "@/lib/services/payment"
import { Reveal } from "@/components/motion/reveal"

// The Ethiopian banks and wallets shoppers ask about. They are NOT payment
// providers yet (checkout and the database's place_order take cash on delivery
// only), so they are shown as "coming soon" — never as accepted. When one is
// wired into src/lib/services/payment.ts, set `available` here.
//
// Plain styled wordmarks, not the institutions' logo files. The names are
// proper nouns and read the same in both languages.
const METHODS: { name: string; colorClass: string; available: boolean }[] = [
  { name: "CBE", colorClass: "text-[#1771A8]", available: false },
  { name: "telebirr", colorClass: "text-[#12804F]", available: false },
  { name: "Awash Bank", colorClass: "text-[#9A6A12]", available: false },
  { name: "Bank of Abyssinia", colorClass: "text-[#2360A8]", available: false },
  { name: "Dashen Bank", colorClass: "text-[#196B49]", available: false },
]

const tileClass =
  "flex h-[72px] min-w-0 flex-col items-center justify-center gap-1 rounded-xl border border-border bg-card px-4 text-center shadow-soft sm:min-w-[160px]"

async function PaymentMethods() {
  const t = await getT()
  const codAvailable = cashOnDeliveryProvider.enabled

  return (
    <Reveal>
      <section aria-labelledby="payments-heading" className="space-y-6 text-center">
        <div className="space-y-2">
          <h2 id="payments-heading" className="font-display text-2xl font-semibold text-charcoal sm:text-[1.75rem]">
            {t("home.payments.title")}
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-text">{t("home.payments.text")}</p>
        </div>
        <ul
          aria-label={t("home.payments.listLabel")}
          className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-center"
        >
          <li className={cn(tileClass, "col-span-2 border-forest/40 sm:col-span-1")}>
            <span className="flex items-center gap-2 text-base font-bold text-forest">
              <Banknote aria-hidden className="size-5" strokeWidth={1.75} />
              {t("home.payments.cod")}
            </span>
            <span className="text-[11px] font-medium text-success">
              {codAvailable ? t("home.payments.available") : t("home.payments.comingSoon")}
            </span>
          </li>
          {METHODS.map((method) => (
            <li
              key={method.name}
              // On phones a lone last tile is centred, not left hanging. Cash on
              // Delivery (item 1) spans both columns, so a lone tile is an EVEN item.
              className={cn(
                tileClass,
                "last:even:col-span-2 last:even:w-[calc(50%-0.375rem)] last:even:justify-self-center sm:last:even:w-auto"
              )}
            >
              <span
                className={cn(
                  "line-clamp-1 text-base font-bold tracking-tight",
                  method.colorClass,
                  !method.available && "opacity-70"
                )}
              >
                {method.name}
              </span>
              <span className="text-[11px] font-medium text-muted-text">
                {method.available ? t("home.payments.available") : t("home.payments.comingSoon")}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </Reveal>
  )
}

export { PaymentMethods }
