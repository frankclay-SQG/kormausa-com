import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "KORMA-USA | Korean Martial Arts Association",
  description: "The Korean Martial Arts Association of the USA — offering authentic Taekwondo Changmookwan, Hapkido Migukyongkwan, and Kumdo instruction for all ages and skill levels.",
  keywords: ["Korean martial arts", "Taekwondo Changmookwan", "Hapkido Migukyongkwan", "Kumdo", "KORMA-USA", "martial arts classes"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
