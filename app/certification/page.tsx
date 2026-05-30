import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { CertificationForm } from "@/components/certification-form";

export const metadata: Metadata = {
  title: "Certification | KORMA-USA",
  description:
    "Apply for black belt, instructor, and school certifications with the Korean Martial Arts Association.",
};

export default function CertificationPage() {
  return (
    <main className="bg-korma-dark min-h-screen">
      <Navbar />
      <CertificationForm />
    </main>
  );
}
