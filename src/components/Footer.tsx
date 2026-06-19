import { Film, Mail, Phone, MapPin, Space as Facebook, Instagram, Twitter, MessageCircle, Globe } from "lucide-react";

interface FooterProps {
  onNavigateHome: () => void;
}

export default function Footer({ onNavigateHome }: FooterProps) {
  return (
    <footer className="bg-[#050505] border-t border-white/5 pt-16 pb-8 text-stone-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand/Slogan */}
          <div className="flex flex-col gap-4">
            <div
              onClick={onNavigateHome}
              className="flex items-center gap-3 cursor-pointer select-none"
            >
              <div className="p-2 bg-amber-500/5 rounded-lg border border-[#C5A059]/30 text-[#C5A059]">
                <Film className="w-5 h-5" />
              </div>
              <span className="font-serif font-bold text-2xl tracking-[0.15em] gold-text">
                LEATURE
              </span>
            </div>
            <p className="text-xs leading-relaxed text-stone-400 mt-2">
              Experience movie ticket booking redesigned. Dynamic schedules, premium halls, physical-matching visual interactive seat selectors, and state-of-the-art cinematic luxury.
            </p>
          </div>

          {/* Location Locations */}
          <div>
            <h3 className="text-stone-100 font-serif font-semibold text-xs tracking-widest uppercase mb-4 text-[#C5A059]">
              Our Locations
            </h3>
            <ul className="flex flex-col gap-3 text-xs">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span>Downtown Premium Luxe (Screen 1-5)</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span>Sunset Galleria (Screen 1-3)</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#C5A059] shrink-0" />
                <span>The Atrium Mall (Screen 1-4)</span>
              </li>
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-stone-100 font-serif font-semibold text-xs tracking-widest uppercase mb-4 text-[#C5A059]">
              Quick Shortcuts
            </h3>
            <ul className="flex flex-col gap-3 text-xs">
              <li>
                <button
                  type="button"
                  onClick={onNavigateHome}
                  className="hover:text-[#C5A059] transition-colors text-left"
                >
                  Now Showing
                </button>
              </li>
              <li>
                <span className="text-stone-500 text-xs">(Upcoming announcements coming soon!)</span>
              </li>
              <li>
                <span className="hover:text-[#C5A059] transition-colors cursor-pointer text-left">
                  Corporate Cinema Booking
                </span>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-stone-100 font-serif font-semibold text-xs tracking-widest uppercase mb-4 text-[#C5A059]">
              Customer Support
            </h3>
            <div className="flex gap-3">
              <a
                href="tel:+9173056-73956"
                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:text-[#C5A059] hover:border-[#C5A059]/30 transition-all shadow-md cursor-pointer flex items-center justify-center text-stone-400"
                title="Call Support: +91 73056-73956"
              >
                <Phone className="w-5 h-5" />
              </a>
              <a
                href="mailto:career@leaturetech.com"
                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:text-[#C5A059] hover:border-[#C5A059]/30 transition-all shadow-md cursor-pointer flex items-center justify-center text-stone-400"
                title="Email: career@leaturetech.com"
              >
                <Mail className="w-5 h-5" />
              </a>
              <a
                href="https://www.leaturetech.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white/5 border border-white/10 rounded-xl hover:text-[#C5A059] hover:border-[#C5A059]/30 transition-all shadow-md cursor-pointer flex items-center justify-center text-stone-400"
                title="Website: www.leaturetech.com"
              >
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Brand Copyright */}
        <div className="pt-8 border-t border-white/5 text-center text-xs flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-stone-500">© {new Date().getFullYear()} Leature Movies Ltd. Crafted for complete premium comfort.</p>
          <div className="flex gap-6 text-stone-500">
            <span className="hover:text-[#C5A059] cursor-pointer">Terms of Service</span>
            <span className="hover:text-[#C5A059] cursor-pointer">Privacy Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
