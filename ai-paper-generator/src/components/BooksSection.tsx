import React from 'react';
import { motion } from 'framer-motion';
import { Book, ChevronRight, Star, Clock, Users } from 'lucide-react';

interface BookItem {
  id: string;
  title: string;
  category: string;
  questions: number;
  image: string;
  rating: number;
  students: number;
}

const BOOKS: BookItem[] = [
  { id: 'b1', title: 'UPSC CSE 2026: Indian Polity', category: 'UPSC', questions: 1200, image: 'https://picsum.photos/seed/polity/300/400', rating: 4.8, students: 1240 },
  { id: 'b2', title: 'SSC CGL: Quantitative Aptitude', category: 'SSC', questions: 2500, image: 'https://picsum.photos/seed/math/300/400', rating: 4.9, students: 8500 },
  { id: 'b3', title: 'Banking Awareness: 2026 Edition', category: 'Banking', questions: 1500, image: 'https://picsum.photos/seed/bank/300/400', rating: 4.7, students: 3200 },
  { id: 'b4', title: 'Modern Indian History', category: 'General', questions: 1000, image: 'https://picsum.photos/seed/history/300/400', rating: 4.6, students: 2100 }
];

interface BooksSectionProps {
  onSelectBook: (book: BookItem) => void;
}

export const BooksSection: React.FC<BooksSectionProps> = ({ onSelectBook }) => {
  return (
    <div className="space-y-12">
      <div className="flex items-end justify-between">
        <div className="space-y-4">
          <span className="text-xs font-black text-brand-primary uppercase tracking-[0.2em]">Exclusive Library</span>
          <h2 className="text-4xl md:text-5xl font-display font-black text-zinc-900 dark:text-white">Practice from <span className="text-brand-primary">Books</span></h2>
          <p className="text-zinc-500 font-medium">Topic-wise practice questions from recommended exam books.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {BOOKS.map((book) => (
          <motion.div 
            key={book.id}
            whileHover={{ y: -10 }}
            className="premium-card group cursor-pointer overflow-hidden p-0 bg-white dark:bg-zinc-900"
            onClick={() => onSelectBook(book)}
          >
            <div className="relative h-64 overflow-hidden">
              <img src={book.image} alt={book.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button className="bg-white text-zinc-900 px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl">Start Now</button>
              </div>
              <div className="absolute top-4 left-4">
                <span className="bg-brand-primary text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg shadow-lg">
                  {book.category}
                </span>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-brand-primary transition-colors line-clamp-2">{book.title}</h3>
              
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Clock size={14} className="text-brand-primary" /> {book.questions} Qs</span>
                <span className="flex items-center gap-1.5"><Star size={14} className="text-amber-400" fill="currentColor" /> {book.rating}</span>
              </div>

              <div className="pt-4 border-t border-zinc-50 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-200" />
                    ))}
                  </div>
                  <span className="text-[10px] text-zinc-500">+{book.students} active</span>
                </div>
                <ChevronRight size={18} className="text-zinc-300 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
