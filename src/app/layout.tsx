import type { Metadata } from "next";
import "./globals.css";
import localFont from "next/font/local";
import { cn } from "@/lib/utils";
import { getClientDictionary, getLocale, getT } from "@/lib/i18n/server";
import { LocaleProvider } from "@/lib/i18n/provider";
import { OG_LOCALE } from "@/lib/seo/metadata";
import { SITE_NAME, SITE_URL } from "@/lib/seo/site";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/providers/auth-provider";
import { MotionProvider } from "@/components/providers/motion-provider";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { Header } from "@/components/layout/header";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { BottomNav } from "@/components/navigation/bottom-nav";

// The three typefaces are SELF-HOSTED (./fonts, all SIL Open Font License,
// fetched from Google Fonts): the same fonts next/font/google would serve, but
// with no network needed to run `next dev` or `next build`. (Turbopack's
// Google-Fonts download has a short timeout; on a slow or busy connection every
// dev page stalled for ~20s and fell back to a system font.) Each file is one
// subset of one variable font — Latin for the Latin fonts, Ethiopic for the
// Ethiopic one — so nothing is shipped that the site never paints.
const inter = localFont({
  src: "./fonts/inter-latin-variable.woff2",
  weight: "100 900",
  variable: "--font-sans",
  display: "swap",
});

// Ethiopic glyphs come from this font in every language, headings included:
// globals.css lists it after the Latin fonts, so Latin text stays in Inter (or
// Playfair) and Amharic falls through to it.
//
// It is NOT preloaded, and it declares the Unicode ranges of the Ethiopic
// blocks. Both matter: without the range, ANY character Inter lacks (a "★" in
// a filter label, say) makes the browser walk the font stack and download this
// ~190KB file just to test its coverage, on an English page that never shows
// a single Ethiopic letter. (next/font/google added the range automatically;
// next/font/local does not.) With it, the file is fetched only when a page
// actually contains Amharic.
const notoSansEthiopic = localFont({
  src: "./fonts/noto-sans-ethiopic-variable.woff2",
  weight: "100 900",
  variable: "--font-amharic",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  declarations: [{ prop: "unicode-range", value: "U+1200-139F, U+2D80-2DDF, U+AB00-AB2F" }],
});

// Display headings ("font-display"): an editorial serif for Latin text. Amharic
// headings use the sans Ethiopic above, in a heavier weight — a second Ethiopic
// font (a serif) would cost Amharic visitors another ~190KB for a difference
// hardly visible in that script. The Playfair file is preloaded (the hero
// headline is the LCP text).
const playfair = localFont({
  src: "./fonts/playfair-display-latin-variable.woff2",
  weight: "400 900",
  variable: "--font-display-latin",
  display: "swap",
  adjustFontFallback: "Times New Roman",
});

// Site-wide defaults. Pages add their own title/description/canonical (see
// lib/seo/metadata.ts); "%s | Ethio Mart" turns a page title into the full one.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const title = t("meta.title", { brand: SITE_NAME });
  const description = t("meta.description");

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${SITE_NAME}` },
    description,
    applicationName: SITE_NAME,
    // Defaults for pages that don't define their own (private pages, 404).
    openGraph: { type: "website", siteName: SITE_NAME, locale: OG_LOCALE[t.locale], title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const dictionary = await getClientDictionary(locale);
  const t = await getT();

  return (
    <html
      lang={locale}
      className={cn("font-sans", inter.variable, notoSansEthiopic.variable, playfair.variable)}
    >
      <body>
        <LocaleProvider locale={locale} dictionary={dictionary}>
          <MotionProvider>
            {/* The first tab stop on every page: keyboard and screen-reader users
                jump past the announcement bar, header and search to the page. It
                is invisible until it has focus. */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-forest-dark focus:shadow-lift focus:ring-2 focus:ring-gold focus:outline-none"
            >
              {t("nav.skipToContent")}
            </a>
            <div className="flex min-h-dvh flex-col">
              <AnnouncementBar />
              <Header />
              <MobileHeader />
              <main id="main-content" tabIndex={-1} className="flex-1 overflow-x-clip outline-none">
                <Container>{children}</Container>
              </main>
              <Footer />
            </div>
            <BottomNav />
            <Toaster />
            <AuthProvider />
          </MotionProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
