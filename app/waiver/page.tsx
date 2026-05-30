import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { WaiverForm } from "@/components/waiver-form";

export const metadata: Metadata = {
  title: "Liability Waiver | KORMA-USA",
  description:
    "Complete your KORMA-USA participant liability waiver before your first class. Electronically signed under Virginia UETA.",
};

export default function WaiverPage() {
  return (
    <main className="bg-korma-dark min-h-screen">
      <Navbar />
      <WaiverForm />
    </main>
  );
}
