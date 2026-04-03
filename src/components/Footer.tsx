import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Mail, Phone, MapPin, ExternalLink, Shield, FileText, Info } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-zinc-900 text-white pt-20 pb-10 mt-auto overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-brand-primary/10 blur-[120px] rounded-full -z-10" />
      
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
                <Award size={24} fill="currentColor" />
              </div>
              <span className="text-xl font-display font-black tracking-tighter">
                PreExam<span className="text-brand-primary">Wale</span>.in
              </span>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed font-medium">
              India's most advanced exam preparation platform. We help students generate custom papers and track their progress with precision.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h4 className="text-sm font-black uppercase tracking-widest text-brand-primary">Resources</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/blog" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group text-sm font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-brand-primary" />
                  Latest News & Jobs
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group text-sm font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-brand-primary" />
                  Practice Dashboard
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 group text-sm font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-brand-primary" />
                  Global Leaderboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-6">
            <h4 className="text-sm font-black uppercase tracking-widest text-brand-primary">Legal</h4>
            <ul className="space-y-4">
              <li>
                <Link to="/privacy-policy" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold group">
                  <Shield size={16} className="text-zinc-600 group-hover:text-brand-primary" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold group">
                  <FileText size={16} className="text-zinc-600 group-hover:text-brand-primary" />
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold group">
                  <Info size={16} className="text-zinc-600 group-hover:text-brand-primary" />
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold group">
                  <Mail size={16} className="text-zinc-600 group-hover:text-brand-primary" />
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h4 className="text-sm font-black uppercase tracking-widest text-brand-primary">Support</h4>
            <div className="space-y-4">
              <div className="flex items-start gap-4 text-zinc-400">
                <Mail size={20} className="text-brand-primary shrink-0" />
                <div className="text-xs">
                  <p className="text-white font-bold mb-0.5">Email Support</p>
                  <p>support@trivendrasingh@zohomail.in</p>
                </div>
              </div>
              <div className="flex items-start gap-4 text-zinc-400">
                <Phone size={20} className="text-brand-primary shrink-0" />
                <div className="text-xs">
                  <p className="text-white font-bold mb-0.5">Phone</p>
                  <p>+91 7906168559)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
            © {currentYear} PreExamWale.in. Managed by PreExam Group.
          </p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
