import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { CheckCircle, Calendar, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Enrollment Confirmed | KORMA-USA",
};

export default function EnrollSuccessPage() {
  return (
    <main className="bg-korma-dark min-h-screen">
      <Navbar />
      <section className="pt-32 pb-24 px-4 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-korma-gold/10 border border-korma-gold/30 flex items-center justify-center mb-8">
          <CheckCircle className="h-10 w-10 text-korma-gold" />
        </div>
        <h1 className="font-cinzel text-3xl md:text-4xl text-white mb-3">
          Enrollment Confirmed!
        </h1>
        <p className="text-white/55 max-w-md mb-10">
          Payment received — welcome to KORMA-USA. You&apos;ll receive a confirmation
          email shortly. Schedule your first class below.
        </p>
        <a
          href="https://meetings-na2.hubspot.com/frank-clay"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-3 bg-korma-gold text-korma-dark font-bold text-sm uppercase tracking-wider hover:bg-korma-gold/90 transition-colors mb-4"
        >
          <Calendar className="h-4 w-4" />
          Schedule Your First Class
        </a>
        <div className="w-full max-w-xs flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/25 text-xs uppercase tracking-wider">also</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <a
          href="/waiver"
          className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white/60 text-sm uppercase tracking-wider hover:border-korma-gold/40 hover:text-white transition-colors mb-10"
        >
          <FileText className="h-4 w-4" />
          Sign Liability Waiver
        </a>
        <a href="/" className="text-white/25 text-sm hover:text-white/50 transition-colors">
          ← Back to home
        </a>
      </section>
    </main>
  );
}
