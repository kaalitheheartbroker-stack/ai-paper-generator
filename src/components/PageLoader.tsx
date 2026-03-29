import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Shield, Info, Mail } from 'lucide-react';

interface Page {
  slug: string;
  title: string;
  content: string;
}

interface PageLoaderProps {
  pages: Page[];
}

export const PageLoader: React.FC<PageLoaderProps> = ({ pages }) => {
  const location = useLocation();
  const slug = location.pathname.substring(1); // remove leading /

  const page = useMemo(() => {
    // Find in DB pages first
    const found = pages.find(p => p.slug === slug);
    if (found) return found;

    // Default hardcoded pages if not in DB
    const defaults: Record<string, { title: string, content: string, icon: any }> = {
      'about': { 
        title: 'About PreExamWale', 
        icon: Info,
        content: `PreExamWale is India's premier AI-powered exam preparation platform. We help students master their competitive exams (UPSC, SSC, Banking, etc.) through intelligent question generation, real-time feedback, and a massive library of practice materials.`
      },
      'privacy-policy': { 
        title: 'Privacy Policy', 
        icon: Shield,
        content: `Your privacy is our priority. We only collect essential information required to provide you with a personalized experience. We do not sell your data to third parties.`
      },
      'terms': { 
        title: 'Terms & Conditions', 
        icon: FileText,
        content: `By using PreExamWale.in, you agree to our terms of service. Our platform is for educational purposes only. Users must not abuse our AI generation system.`
      },
      'contact': { 
        title: 'Contact Us', 
        icon: Mail,
        content: `Have questions? Reach out to us at support@preexamwale.in or call us at +91 98765 43210. Our team is available 24/7.`
      }
    };

    return defaults[slug] || { title: 'Page Not Found', content: 'The page you are looking for does not exist.', icon: Info };
  }, [slug, pages]);

  const Icon = (page as any).icon || Info;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto py-20 px-6 space-y-12"
    >
      <div className="text-center space-y-6">
        <div className="w-20 h-20 bg-brand-primary/10 text-brand-primary rounded-[2rem] flex items-center justify-center mx-auto">
          <Icon size={40} />
        </div>
        <h1 className="text-5xl font-display font-black text-zinc-900 dark:text-white">{page.title}</h1>
        <div className="h-1.5 w-24 bg-brand-primary rounded-full mx-auto" />
      </div>

      <div className="premium-card p-12 bg-white dark:bg-zinc-900 shadow-xl border border-zinc-100 dark:border-zinc-800 rounded-[3rem]">
        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <p className="text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium whitespace-pre-wrap">
            {page.content}
          </p>
        </div>
      </div>

      <div className="text-center pt-8">
        <p className="text-zinc-400 text-sm font-black uppercase tracking-[0.2em]">Latest Update: March 2026</p>
      </div>
    </motion.div>
  );
};
