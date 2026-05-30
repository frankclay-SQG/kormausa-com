import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { XCircle, RefreshCw } from "lucide-react";

export const metadata: Metadata = {
  title: "Checkout Cancelled | KORMA-USA",
};

export default function EnrollCancelPage() {
  return (
    <main className="bg-korma-dark min-h-screen">
      <Navbar />
      <section className="pt-32 pb-24 px-4 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-8">
          <XCircle className="h-10 w-10 text-white/30" />
        </div>
        <h1 className="font-cinzel text-3xl md:text-4xl text-white mb-3">
          Checkout Cancelled
        </h1>
        <p className="text-white/55 max-w-md mb-10">
          No worries — your spot is still available. Retry when you&apos;re ready,
          or reach out if you have any questions.
        </p>
        <a
          href="/enroll"
          className="inline-flex items-center gap-2 px-8 py-3 bg-korma-gold text-korma-dark font-bold text-sm uppercase tracking-wider hover:bg-korma-gold/90 transition-colors mb-4"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </a>
        <a href="/" className="text-white/25 text-sm hover:text-white/50 transition-colors">
          ← Back to home
        </a>
      </section>
    </main>
  );
}
