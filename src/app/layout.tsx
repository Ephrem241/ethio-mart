import type { Metadata } from "next";
import "./globals.css";
import { Inter, Noto_Sans_Ethiopic } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Header } from "@/components/layout/header";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Footer } from "@/components/layout/footer";
import { Container } from "@/components/layout/container";
import { BottomNav } from "@/components/navigation/bottom-nav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const notoSansEthiopic = Noto_Sans_Ethiopic({
  subsets: ["ethiopic", "latin"],
  variable: "--font-amharic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Premium Ethiopian E-Commerce 2.0",
  description: "A modern Ethiopian online marketplace.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable, notoSansEthiopic.variable)}>
      <body>
        <div className="flex min-h-dvh flex-col pb-16 lg:pb-0">
          <Header />
          <MobileHeader />
          <main className="flex-1">
            <Container>{children}</Container>
          </main>
          <Footer />
        </div>
        <BottomNav />
        <Toaster />
        <AuthProvider />
      </body>
    </html>
  );
}
