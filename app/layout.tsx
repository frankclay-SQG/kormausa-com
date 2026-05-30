import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "KORMA-USA | Korean Martial Arts Association",
  description: "The Korean Martial Arts Association of the USA — offering authentic KumDo, Hapkido, and Tai Chi instruction for all ages and skill levels.",
  keywords: ["Korean martial arts", "KumDo", "Hapkido", "Tai Chi", "KORMA-USA", "martial arts classes"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
