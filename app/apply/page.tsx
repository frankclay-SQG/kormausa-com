import type { Metadata } from "next";
import { ApplicationBuilder } from "@/components/application/application-builder";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Apply | KORMA-USA",
  description:
    "Start with certification review, then complete the KORMA-USA application package for school registration, rank registration, or instructor certification.",
};

export default function ApplyPage() {
  return (
    <main className="min-h-screen bg-korma-dark">
      <Navbar />
      <ApplicationBuilder />
      <Footer />
    </main>
  );
}
