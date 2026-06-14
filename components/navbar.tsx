"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Home", href: "/" },
  {
    label: "Programs",
    href: "/#programs",
    children: [
      { label: "Taekwondo Changmookwan", href: "/#taekwondo" },
      { label: "Hapkido Migukyongkwan", href: "/#hapkido" },
      { label: "Self Defense", href: "/#seminars" },
      { label: "Kumdo", href: "/#kumdo" },
    ],
  },
  { label: "About", href: "/#about" },
  { label: "Applications", href: "/applications" },
  { label: "Certification", href: "/certification" },
  { label: "Contact", href: "/#contact" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [programsOpen, setProgramsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-korma-navy-deeper/95 backdrop-blur-md shadow-lg shadow-black/30 py-2"
          : "bg-transparent py-4"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-12 h-12 flex-shrink-0">
            <Image
              src="/korma-usa-logo.svg"
              alt="KORMA-USA Logo"
              fill
              className="object-contain"
              unoptimized
              sizes="48px"
            />
          </div>
          <div className="leading-tight">
            <span className="block text-white font-bold text-base tracking-widest uppercase">
              KORMA-USA
            </span>
            <span className="block text-korma-gold text-[10px] tracking-[0.2em] uppercase">
              Korean Martial Arts Association
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) =>
            link.children ? (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => setProgramsOpen(true)}
                onMouseLeave={() => setProgramsOpen(false)}
              >
                <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white/80 hover:text-korma-gold transition-colors uppercase tracking-wider">
                  {link.label}
                  <ChevronDown className="h-3 w-3" />
                </button>
                {programsOpen && (
                  <div className="absolute top-full left-0 mt-1 w-44 bg-korma-navy-deeper border border-korma-gold/20 rounded-lg shadow-xl overflow-hidden">
                    {link.children.map((child) => (
                      <Link
                        key={child.label}
                        href={child.href}
                        className="block px-4 py-3 text-sm text-white/80 hover:text-korma-gold hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                        onClick={() => setProgramsOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-white/80 hover:text-korma-gold transition-colors uppercase tracking-wider"
              >
                {link.label}
              </Link>
            )
          )}
          <Link
            href="/enroll"
            className="ml-4 px-5 py-2 bg-korma-gold text-korma-dark font-bold text-sm rounded uppercase tracking-wider hover:bg-korma-gold-light transition-colors"
          >
            Enroll Now
          </Link>
        </nav>

        {/* Mobile burger */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-korma-navy-deeper/98 border-t border-korma-gold/20 px-4 pb-6 pt-4">
          {navLinks.map((link) => (
            <div key={link.label}>
              <Link
                href={link.href}
                className="block py-3 text-white/80 hover:text-korma-gold font-medium uppercase tracking-wider text-sm border-b border-white/5"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
              {link.children?.map((child) => (
                <Link
                  key={child.label}
                  href={child.href}
                  className="block py-2 pl-4 text-white/60 hover:text-korma-gold text-sm"
                  onClick={() => setMobileOpen(false)}
                >
                  &gt; {child.label}
                </Link>
              ))}
            </div>
          ))}
          <Link
            href="/enroll"
            className="mt-4 block text-center px-5 py-3 bg-korma-gold text-korma-dark font-bold text-sm rounded uppercase tracking-wider"
            onClick={() => setMobileOpen(false)}
          >
            Enroll Now
          </Link>
        </div>
      )}
    </header>
  );
}
