import type { Metadata } from "next"
import { ChevronDown } from "lucide-react"

import { getT } from "@/lib/i18n/server"
import type { MessageKey } from "@/lib/i18n/translator"
import { pageMetadata } from "@/lib/seo/metadata"
import { InfoHelp, InfoLink, InfoPage } from "@/components/info/info-page"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT()
  return pageMetadata({
    locale: t.locale,
    path: "/faq",
    title: t("info.faq.title"),
    description: t("info.faq.subtitle"),
  })
}

// Each answer may point at the page that covers it in full.
const questions: {
  question: MessageKey
  answer: MessageKey
  link?: { href: string; label: MessageKey }
}[] = [
  { question: "info.faq.q1", answer: "info.faq.a1" },
  { question: "info.faq.q2", answer: "info.faq.a2" },
  { question: "info.faq.q3", answer: "info.faq.a3" },
  { question: "info.faq.q4", answer: "info.faq.a4", link: { href: "/delivery", label: "footer.delivery" } },
  { question: "info.faq.q5", answer: "info.faq.a5", link: { href: "/account/orders", label: "info.common.ordersLink" } },
  { question: "info.faq.q6", answer: "info.faq.a6", link: { href: "/contact", label: "footer.contact" } },
  { question: "info.faq.q7", answer: "info.faq.a7", link: { href: "/returns", label: "footer.returns" } },
  { question: "info.faq.q8", answer: "info.faq.a8" },
  { question: "info.faq.q9", answer: "info.faq.a9", link: { href: "/privacy", label: "footer.privacy" } },
]

// Native <details>: keyboard and screen-reader friendly, and no JavaScript.
export default async function FaqPage() {
  const t = await getT()

  return (
    <InfoPage title={t("info.faq.title")} description={t("info.faq.subtitle")}>
      <div className="divide-y divide-border overflow-hidden rounded-card border border-border bg-white">
        {questions.map((item) => (
          <details key={item.question} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 font-medium text-charcoal outline-none marker:hidden hover:bg-cream/50 focus-visible:bg-cream/50 focus-visible:ring-2 focus-visible:ring-forest/40 focus-visible:ring-inset sm:px-5 [&::-webkit-details-marker]:hidden">
              {t(item.question)}
              <ChevronDown
                aria-hidden
                className="size-5 shrink-0 text-forest transition-transform duration-200 group-open:rotate-180"
              />
            </summary>
            <div className="space-y-3 px-4 pb-5 leading-relaxed text-charcoal/80 sm:px-5">
              <p>{t(item.answer)}</p>
              {item.link && <InfoLink href={item.link.href}>{t(item.link.label)}</InfoLink>}
            </div>
          </details>
        ))}
      </div>

      <InfoHelp title={t("info.faq.moreTitle")} text={t("info.faq.moreText")} showFaq={false} />
    </InfoPage>
  )
}
