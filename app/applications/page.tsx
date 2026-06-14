import type { Metadata } from "next";
import { ApplicationBuilder } from "@/components/application/application-builder";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: "Applications | KORMA-USA",
  description:
    "Start with certification review, then complete KORMA-USA registration and application details for school registration, rank registration, or instructor certification.",
};

export default function ApplicationsPage() {
  return (
    <main className="min-h-screen bg-korma-dark">
      <Navbar />
      <ApplicationBuilder />
      <Footer />
    </main>
  );
}
