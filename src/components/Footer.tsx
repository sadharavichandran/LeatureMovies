import React, { useState } from 'react';
import { Mail, Phone, Globe, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import PlatformReviewModal from './PlatformReviewModal';

interface FooterProps {
  onNavigateHome: () => void;
}

export default function Footer({ onNavigateHome }: FooterProps) {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  const [showReviewModal, setShowReviewModal] = useState(false);

  return (
    <footer className="bg-[#050505] border-t border-white/5 pt-16 pb-8 text-stone-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          {/* Brand/Slogan */}
          <div className="flex flex-col gap-4">
            <div onClick={onNavigateHome} className="flex items-center gap-3 cursor-pointer select-none group">
              <img src="/logo.png" alt="Leature Logo" className="h-8 md:h-10 object-contain group-hover:brightness-110 transition-all" />
            </div>
            <p className="text-xs leading-relaxed text-stone-400 mt-2">
              {t('footer.tagline')}
            </p>
          </div>


          {/* Contact */}
          <div>
            <h3 className="text-stone-100 font-serif font-semibold text-xs tracking-widest uppercase mb-4 text-[#C5A059]">
              {t('footer.customerSupport')}
            </h3>
            <div className="flex gap-3">
              <a href="tel:+9173056-73956" className="p-3 bg-white/5 border border-white/10 rounded-xl hover:text-[#C5A059] hover:border-[#C5A059]/30 transition-all shadow-md cursor-pointer flex items-center justify-center text-stone-400" title="Call Support: +91 73056-73956">
                <Phone className="w-5 h-5" />
              </a>
              <a href="mailto:career@leaturetech.com" className="p-3 bg-white/5 border border-white/10 rounded-xl hover:text-[#C5A059] hover:border-[#C5A059]/30 transition-all shadow-md cursor-pointer flex items-center justify-center text-stone-400" title="Email: career@leaturetech.com">
                <Mail className="w-5 h-5" />
              </a>
              <a href="https://www.leaturetech.com" target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 border border-white/10 rounded-xl hover:text-[#C5A059] hover:border-[#C5A059]/30 transition-all shadow-md cursor-pointer flex items-center justify-center text-stone-400" title="Website: www.leaturetech.com">
                <Globe className="w-5 h-5" />
              </a>
              <button type="button" onClick={() => setShowReviewModal(true)} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:text-[#C5A059] hover:border-[#C5A059]/30 transition-all shadow-md cursor-pointer flex items-center justify-center text-stone-400" title="Submit App Feedback">
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-white/5 text-center text-xs flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-stone-500">{t('footer.copyright', { year })}</p>
          <div className="flex gap-6 text-stone-500">
            <span className="hover:text-[#C5A059] cursor-pointer">{t('footer.terms')}</span>
            <span className="hover:text-[#C5A059] cursor-pointer">{t('footer.privacy')}</span>
          </div>
        </div>
      </div>
      {showReviewModal && <PlatformReviewModal onClose={() => setShowReviewModal(false)} />}
    </footer>
  );
}
