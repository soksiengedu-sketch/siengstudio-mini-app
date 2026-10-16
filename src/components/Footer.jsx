import React from 'react';
import { useApp } from '../context/AppContext';
import { Crown, Coins, ShieldCheck, Film, Send, Heart, Sparkles, ExternalLink, HelpCircle } from 'lucide-react';
import { haptic } from '../services/telegram';

export default function Footer() {
  const { setActiveTab, openAdmin, lang, t } = useApp();

  return (
    <footer className="w-full bg-[#07080d] border-t border-white/5 text-gray-400 mt-12 transition-colors">
      {/* Top Value Banner */}
      <div className="border-b border-white/5 bg-gradient-to-r from-purple-950/20 via-black to-red-950/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center md:text-left">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                <Film size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">រឿងភាគខ្លីគុណភាព Ultra HD</h4>
                <p className="text-[11px] text-gray-400">ច្បាស់ត្រជាក់ភ្នែក គ្មានស្ទាក់</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">សំឡេង & អក្សររត់ខ្មែរ</h4>
                <p className="text-[11px] text-gray-400">100% Khmer Dubbed & Subs</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <Coins size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">ទូទាត់ភ្លាមៗ KHQR Bakong</h4>
                <p className="text-[11px] text-gray-400">ស្វ័យប្រវត្តិកាក់ចូលភ្លាមៗ</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">សុវត្ថិភាព និងភាពជឿជាក់</h4>
                <p className="text-[11px] text-gray-400">Cloudflare R2 Protected</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div 
              className="flex items-center gap-2.5 cursor-pointer inline-flex"
              onClick={() => {
                haptic.light();
                setActiveTab('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <div className="w-9 h-9 rounded-full overflow-hidden shadow-lg ring-1.5 ring-red-500/30 flex-shrink-0 bg-black">
                <img src="/logo.png" alt="SiengStudio Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent">
                  Sieng<span className="text-red-500 font-black">Studio</span>
                </span>
                <p className="text-[11px] text-red-400 font-medium">វេទិកាទស្សនារឿងភាគខ្លីអនឡាញឈានមុខគេ</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              SiengStudio គឺជាគេហទំព័រផ្តល់ជូននូវរឿងភាគខ្លី (Short Dramas) ភាពយន្តភាគរំភើប ស្នេហា កំប្លែង និងការសងសឹក គុណភាពខ្ពស់ HD/4K ជាមួយការបញ្ចូលសំឡេងជាភាសាខ្មែរ សម្រាប់ទស្សនិកជនទូទាំងប្រទេសកម្ពុជា។
            </p>

            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://t.me/chansoksieng"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Send size={13} /> Telegram: @chansoksieng
              </a>
              <button
                onClick={() => {
                  haptic.medium();
                  openAdmin('dashboard');
                }}
                className="px-3 py-1.5 rounded-xl bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 text-xs font-bold border border-white/10 flex items-center gap-1.5 transition-all"
              >
                <Crown size={13} className="text-amber-400" /> Admin
              </button>
            </div>
          </div>

          {/* Quick Links Column 1 */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">រុករក (Explore)</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => {
                    setActiveTab('home');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors"
                >
                  🏠 ទំព័រដើម (Home)
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('search');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors"
                >
                  🔍 ស្វែងរករឿងភាគ (Search)
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('library');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors"
                >
                  📚 បណ្ណាល័យផ្ទាល់ខ្លួន (My Library)
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab('wallet');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors"
                >
                  💎 កញ្ចប់ VIP & កាក់ (VIP Plans)
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Links Column 2 */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">ប្រភេទរឿង (Genres)</h4>
            <ul className="space-y-2 text-xs">
              <li className="hover:text-white cursor-pointer" onClick={() => setActiveTab('search')}>
                ❤️ ស្នេហារ៉ូមែនទិក (Romance)
              </li>
              <li className="hover:text-white cursor-pointer" onClick={() => setActiveTab('search')}>
                💼 មហាសេដ្ឋី & CEO (Billionaire)
              </li>
              <li className="hover:text-white cursor-pointer" onClick={() => setActiveTab('search')}>
                ⚡ ការសងសឹក (Revenge)
              </li>
              <li className="hover:text-white cursor-pointer" onClick={() => setActiveTab('search')}>
                🥊 វាយប្រហារ & សកម្មភាព (Action)
              </li>
              <li className="hover:text-white cursor-pointer" onClick={() => setActiveTab('search')}>
                🎙️ រឿងនិយាយខ្មែរ (Khmer Dubbed)
              </li>
            </ul>
          </div>

          {/* Quick Links Column 3 */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">សេវាកម្ម & សុវត្ថិភាព</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Bakong KHQR 24/7
              </li>
              <li className="flex items-center gap-1.5 text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Cloudflare CDN High-Speed
              </li>
              <li className="flex items-center gap-1.5 text-gray-300">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                គាំទ្រ Mobile, Tablet & PC
              </li>
              <li className="pt-1 text-[11px] text-gray-500">
                រាល់ទិន្នន័យត្រូវបានការពារដោយការអ៊ិនគ្រីបកម្រិតខ្ពស់។
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500">
          <p>© 2026 SiengStudio. រក្សាសិទ្ធិគ្រប់យ៉ាង (All Rights Reserved).</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              ផលិតឡើងដោយក្តីស្រលាញ់ <Heart size={12} className="text-red-500 fill-red-500" /> សម្រាប់អ្នកគាំទ្រភាពយន្តភាគ
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
