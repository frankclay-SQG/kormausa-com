import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { EnrollForm } from "@/components/enroll-form";

export const metadata: Metadata = {
  title: "Enroll | KORMA-USA",
  description:
    "Join KORMA-USA and begin your martial arts journey. Monthly classes in Taekwondo, Hapkido, and KumDo. Free trial available.",
};

export default function EnrollPage() {
  return (
    <main className="bg-korma-dark min-h-screen">
      <Navbar />
      <EnrollForm />
    </main>
  );
}
