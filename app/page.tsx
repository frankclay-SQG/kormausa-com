import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { Programs } from "@/components/programs";
import { About } from "@/components/about";
import { ChurchHillVacationNotice } from "@/components/church-hill-vacation-notice";
import { Seminars } from "@/components/seminars";
import { Contact } from "@/components/contact";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main className="bg-korma-dark">
      <Navbar />
      <Hero />
      <Programs />
      <About />
      <Seminars />
      <Contact />
      <Footer />
      <ChurchHillVacationNotice />
    </main>
  );
}
