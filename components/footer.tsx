import Image from "next/image";
import Link from "next/link";
export function Footer() {
  return (
    <footer className="bg-korma-dark border-t border-white/[0.07]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4"><div className="relative w-10 h-10"><Image src="https://galaxy-prod.tlcdn.com/gen/user_34hHhppb2NuRvdy5opEyFBssEv2/d9ba3e4f-cb21-4341-86c8-118efeaa9365.jpg" alt="KORMA-USA" fill className="object-contain" sizes="40px" /></div><div><span className="block text-white font-bold tracking-widest uppercase text-sm">KORMA-USA</span><span className="block text-korma-gold text-[10px] tracking-[0.2em] uppercase">Korean Martial Arts Association</span></div></div>
            <p className="text-white/40 text-sm leading-relaxed max-w-sm">Preserving and sharing the authentic martial arts heritage of Korea with students of all ages and backgrounds across the United States.</p>
          </div>
          <div><h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Programs</h4><ul className="space-y-2">{["KumDo", "Hapkido", "Tai Chi", "Self-Defense Seminars"].map((item) => (<li key={item}><Link href="#programs" className="text-white/40 text-sm hover:text-korma-gold transition-colors">{item}</Link></li>))}</ul></div>
          <div><h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Quick Links</h4><ul className="space-y-2">{[{ label: "About Us", href: "#about" }, { label: "Free Trial Class", href: "#contact" }, { label: "Contact", href: "#contact" }, { label: "Enroll Now", href: "#contact" }].map((item) => (<li key={item.label}><Link href={item.href} className="text-white/40 text-sm hover:text-korma-gold transition-colors">{item.label}</Link></li>))}</ul></div>
        </div>
        <div className="border-t border-white/[0.07] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/25 text-xs">© {new Date().getFullYear()} KORMA-USA — Korean Martial Arts Association. All rights reserved.</p>
          <div className="flex gap-6"><Link href="#" className="text-white/25 text-xs hover:text-white/50 transition-colors">Privacy Policy</Link><Link href="#" className="text-white/25 text-xs hover:text-white/50 transition-colors">Terms of Service</Link></div>
        </div>
      </div>
    </footer>
  );
}
