import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sun,
  Moon,
  Upload, 
  BookOpen, 
  Trophy, 
  MessageSquare, 
  ChevronRight,
  ExternalLink,
  FileText, 
  Layout, 
  Zap,
  CheckCircle2,
  Download,
  Play,
  TrendingUp,
  Search,
  Book,
  ArrowRight,
  Home,
  PlusCircle,
  History,
  BarChart3,
  Clock,
  MoreVertical,
  Lock,
  Timer,
  ChevronLeft,
  AlertCircle,
  AlertTriangle,
  Award,
  Target,
  Lightbulb,
  RotateCcw,
  LogOut,
  LogIn,
  Globe,
  Calculator,
  List
} from 'lucide-react';
import { Routes, Route, useNavigate, useLocation, Link, Navigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from './firebase';

// Firebase Auth
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Firestore
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  AdminDashboard, 
  AdminBlogs, 
  AdminCategories,
  AdminPages, 
  AdminAds, 
  BlogList, 
  BlogDetail, 
  PageLoader,
  PublicHome
} from './CMS';
import Footer from './components/Footer';
import Login from './components/Login';
import { LiveChat } from './components/LiveChat';
import { BooksSection } from './components/BooksSection';

import { GoogleGenAI } from "@google/genai";
import * as pdfjs from 'pdfjs-dist';
import localQuestions from './data/questions.json';
import { generateQuestionsFromText } from './services/AIService';
import AdminPanel from './components/AdminPanel';

// Initialize PDF.js worker using CDN to avoid Vite build issues
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type QuestionType = 'MCQ' | 'Short' | 'Long' | 'True-False' | 'Assumption';
type Tab = 'home' | 'dashboard' | 'generate' | 'my-papers' | 'leaderboard' | 'blog' | 'admin-dashboard' | 'admin-blogs' | 'admin-pages' | 'admin-ads';

const EXAM_CATEGORIES = [
  { id: 'all', label: 'All Exams' },
  { id: 'upsc', label: 'UPSC' },
  { id: 'ssc', label: 'SSC' },
  { id: 'banking', label: 'Banking' },
  { id: 'railway', label: 'Railway' },
  { id: 'state', label: 'State Exams' },
  { id: 'gate', label: 'GATE/ESE' },
  { id: 'neet', label: 'NEET/JEE' },
];

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: 'Job Update' | 'Exam News';
  date: string;
  image: string;
  readTime: string;
}

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  topic: string;
}

interface Paper {
  id: string;
  name: string;
  type: QuestionType;
  questions: number;
  date: string;
  status: 'completed' | 'pending';
  content?: Question[];
  uid?: string;
}

const MOCK_BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'SSC CGL 2026 Notification Out: 15,000+ Vacancies Announced',
    excerpt: 'The Staff Selection Commission has released the official notification for CGL 2026. Check eligibility, exam dates, and syllabus here.',
    category: 'Job Update',
    date: '21 Mar 2026',
    image: 'https://picsum.photos/seed/ssc/600/400',
    readTime: '5 min read'
  },
  {
    id: '2',
    title: 'UPSC Prelims 2026: Strategy for Last 60 Days',
    excerpt: 'Master your UPSC preparation with our expert-curated 60-day revision plan focusing on high-yield topics.',
    category: 'Exam News',
    date: '20 Mar 2026',
    image: 'https://picsum.photos/seed/upsc/600/400',
    readTime: '8 min read'
  },
  {
    id: '3',
    title: 'IBPS PO Mains Result 2025 Declared: Direct Link to Check',
    excerpt: 'IBPS has announced the results for the PO Mains examination. Candidates can now check their qualifying status.',
    category: 'Exam News',
    date: '19 Mar 2026',
    image: 'https://picsum.photos/seed/ibps/600/400',
    readTime: '3 min read'
  },
  {
    id: '4',
    title: 'Railways RRB NTPC Recruitment 2026: Apply Online Now',
    excerpt: 'Indian Railways is inviting applications for various non-technical popular categories. Over 10,000 posts available.',
    category: 'Job Update',
    date: '18 Mar 2026',
    image: 'https://picsum.photos/seed/rrb/600/400',
    readTime: '6 min read'
  }
];

const MOCK_QUESTIONS: Question[] = [
  { id: '1', text: 'Which article of the Indian Constitution deals with the Amendment procedure?', options: ['Article 352', 'Article 356', 'Article 360', 'Article 368'], correctAnswer: 3, topic: 'Constitutional Amendments' },
  { id: '2', text: 'Who is known as the Father of the Indian Constitution?', options: ['Mahatma Gandhi', 'Jawaharlal Nehru', 'B.R. Ambedkar', 'Sardar Patel'], correctAnswer: 2, topic: 'Constitutional History' },
  { id: '3', text: 'The concept of "Directive Principles of State Policy" was borrowed from which country?', options: ['USA', 'Ireland', 'UK', 'Canada'], correctAnswer: 1, topic: 'Sources of Constitution' },
  { id: '4', text: 'Which fundamental right was described by Dr. B.R. Ambedkar as the "Heart and Soul of the Constitution"?', options: ['Right to Equality', 'Right against Exploitation', 'Right to Constitutional Remedies', 'Right to Freedom of Religion'], correctAnswer: 2, topic: 'Fundamental Rights' },
  { id: '5', text: 'The Preamble of the Indian Constitution has been amended how many times?', options: ['Once', 'Twice', 'Thrice', 'Never'], correctAnswer: 0, topic: 'Preamble' },
  { id: '6', text: 'Which of the following is NOT a fundamental right?', options: ['Right to Equality', 'Right to Property', 'Right against Exploitation', 'Right to Freedom of Religion'], correctAnswer: 1, topic: 'Fundamental Rights' },
  { id: '7', text: 'The President of India can be removed from office by?', options: ['The Prime Minister', 'The Supreme Court', 'Impeachment by Parliament', 'The Vice President'], correctAnswer: 2, topic: 'Executive' },
  { id: '8', text: 'Who appoints the Chief Justice of India?', options: ['The Prime Minister', 'The President', 'The Law Minister', 'The Parliament'], correctAnswer: 1, topic: 'Judiciary' },
  { id: '9', text: 'The First General Elections in India were held in?', options: ['1947', '1950', '1951-52', '1955'], correctAnswer: 2, topic: 'Electoral System' },
  { id: '10', text: 'Which Schedule of the Indian Constitution contains the list of recognized languages?', options: ['Seventh Schedule', 'Eighth Schedule', 'Ninth Schedule', 'Tenth Schedule'], correctAnswer: 1, topic: 'Schedules' },
];

const Logo = ({ className = "w-10 h-10", iconSize = 24 }: { className?: string; iconSize?: number }) => (
  <div className="flex items-center gap-3 group">
    <div className={`${className} bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-primary/30 group-hover:scale-110 transition-transform`}>
      <Award size={iconSize} fill="currentColor" />
    </div>
    <span className="text-xl font-display font-bold tracking-tighter dark:text-white">
      PreExam<span className="text-brand-primary">Wale</span>.in
    </span>
  </div>
);

const SLIDER_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf', title: 'UPSC Preparation', desc: 'Syllabus oriented papers' },
  { url: 'https://images.unsplash.com/photo-1434031211128-57d6062609fb', title: 'SSC & Government Exams', desc: 'Previous year patterns' },
  { url: 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5', title: 'Medical & Engineering', desc: 'NEET/JEE tailored practice' }
];

const AutoSlider = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % SLIDER_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[400px] md:h-[600px] rounded-[3rem] overflow-hidden group shadow-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img src={SLIDER_IMAGES[current].url} alt="exam" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 text-left p-12 flex flex-col justify-end">
            <motion.h3 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-4xl md:text-6xl font-display font-black text-white mb-4 tracking-tighter"
            >
              {SLIDER_IMAGES[current].title}
            </motion.h3>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-lg md:text-xl text-white/70 font-medium"
            >
              {SLIDER_IMAGES[current].desc}
            </motion.p>
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="absolute bottom-8 left-12 flex gap-3 z-20">
        {SLIDER_IMAGES.map((_, i) => (
          <div 
            key={i} 
            className={`h-1.5 rounded-full transition-all duration-500 ${current === i ? 'w-10 bg-brand-primary' : 'w-4 bg-white/30'}`}
          />
        ))}
      </div>
    </div>
  );
};

const LoadingScreen = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[200] bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md flex flex-col items-center justify-center space-y-8"
  >
    <Logo className="w-20 h-20" iconSize={48} />
    <div className="flex flex-col items-center space-y-4">
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{ 
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2
            }}
            className="w-3 h-3 bg-brand-primary rounded-full"
          />
        ))}
      </div>
      <p className="text-lg font-display font-black text-zinc-900 dark:text-white animate-pulse">
        Generating your paper...
      </p>
      <p className="text-sm text-zinc-500 font-medium">
        Analyzing your study material for the best questions
      </p>
    </div>
  </motion.div>
);

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    // Initial theme sync
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const [user, setUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      let localUid = localStorage.getItem('guest_uid');
      if (!localUid) {
        localUid = 'guest_' + Math.random().toString(36).substring(2, 12);
        localStorage.setItem('guest_uid', localUid);
      }
      return {
        uid: localUid,
        displayName: 'Guest Student',
        email: 'guest@preexamwale.in',
        photoURL: ''
      };
    }
    return null;
  });
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [dbPages, setDbPages] = useState<any[]>([]);
  const [adSettings, setAdSettings] = useState<any>({});
  const [isAdminMode, setIsAdminMode] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect admin users to /admin panel automatically
  useEffect(() => {
    if (user && user.email === 'rstenguriya16@gmail.com') {
      if (!location.pathname.startsWith('/admin')) {
        navigate('/admin');
      }
    }
  }, [user, location.pathname, navigate]);

  const activeTab: Tab = useMemo(() => {
    const path = location.pathname;
    if (path.includes('/generate')) return 'generate';
    if (path.includes('/history')) return 'my-papers';
    if (path.includes('/leaderboard')) return 'leaderboard';
    if (path.includes('/blog')) return 'blog';
    return 'dashboard';
  }, [location.pathname]);

  const setActiveTab = (tab: Tab) => {
    if (tab === 'dashboard') navigate('/');
    else if (tab === 'my-papers') navigate('/history');
    else navigate(`/${tab}`);
  };

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [generationMethod, setGenerationMethod] = useState<'upload' | 'manual'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'ready' | 'generated'>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState<QuestionType>('MCQ');
  const [numQuestions, setNumQuestions] = useState(20);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedPaper, setGeneratedPaper] = useState<{ name: string; questions: any[] } | null>(null);
  
  // Test System State
  const [isTesting, setIsTesting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [skippedQuestions, setSkippedQuestions] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [testResults, setTestResults] = useState<{
    score: number;
    total: number;
    accuracy: number;
    timeTaken: number;
    skipped: number;
    analysis: {
      strongTopics: string[];
      weakTopics: string[];
    };
  } | null>(null);
  const [testStartTime, setTestStartTime] = useState(0);
  const [activePaperId, setActivePaperId] = useState<string | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Auth state is handled in the Login component or via onAuthStateChanged

  const papersCount = papers.length;
  const isRestricted = papersCount >= 10;

  const handleUpload = async (file: File) => {
    setUploadFile(file);
    setUploadStatus('uploading');
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      
      console.log("PDF Extracted Length:", fullText.length);
      if (fullText.trim().length <= 50) {
        throw new Error("Extracted text is too short or empty.");
      }
      
      setExtractedText(fullText);
      setUploadStatus('ready');
    } catch (error: any) {
      console.error('Error extracting text from PDF:', error);
      alert(error.message || 'Failed to process PDF. Please try again.');
      setUploadStatus('idle');
      setUploadFile(null);
    }
  };



  // Removed deprecated OTP handlers

  const logout = async () => {
    try {
      localStorage.removeItem('guest_uid');
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        if (!currentUser.emailVerified && currentUser.providerData.some(p => p.providerId === 'password')) {
          await signOut(auth);
          setUser(null);
          setIsAuthReady(true);
          return;
        }

        setUser(currentUser);
        setIsAuthReady(true);
        console.log("Auth Success");

        // --- Non-blocking Background Sync ---
        const syncUser = async (retries = 3) => {
          try {
            const userRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
              await setDoc(userRef, {
                displayName: currentUser.displayName || 'Anonymous',
                email: currentUser.email || '',
                photoURL: currentUser.photoURL || '',
                role: 'student',
                verified: true,
                createdAt: new Date().toISOString()
              });
            }
          } catch (dbError: any) {
            console.warn(`[App] Firestore sync attempt failed (${dbError.message}).`);
            if (retries > 0) {
              console.log(`[App] Retrying sync in 5s... (${retries} left)`);
              setTimeout(() => syncUser(retries - 1), 5000);
            }
          }
        };
        syncUser();
      } else {
        setUser(null);
        setIsAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Sync Blogs
    const qBlogs = query(collection(db, 'blogs'));
    const unsubBlogs = onSnapshot(qBlogs, (snapshot) => {
      setBlogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Sync Pages
    const unsubPages = onSnapshot(collection(db, 'pages'), (snapshot) => {
      setDbPages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Sync Ads
    const unsubAds = onSnapshot(doc(db, 'settings', 'ads'), (snapshot) => {
      if (snapshot.exists()) setAdSettings(snapshot.data());
    });

    return () => {
      unsubBlogs();
      unsubPages();
      unsubAds();
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'papers'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const papersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Paper[];
      setPapers(papersData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, (error) => {
      console.error('Error fetching papers:', error);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, 'leaderboard'), where('timestamp', '>', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leaderboardData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => b.score - a.score);
      setLeaderboard(leaderboardData);
    });

    return () => unsubscribe();
  }, []);

  const filteredPapers = useMemo(() => {
    if (selectedCategory === 'all') return papers;
    return papers.filter(p => p.category?.toLowerCase() === selectedCategory.toLowerCase());
  }, [papers, selectedCategory]);

  // Caching for generation
  const [generationCache, setGenerationCache] = useState<Record<string, Question[]>>(() => {
    const saved = localStorage.getItem('generation_cache');
    try {
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('generation_cache', JSON.stringify(generationCache));
  }, [generationCache]);

  const generateLocalQuestions = (type: QuestionType, count: number, category: string): Question[] => {
    // Map category to best available local set
    let categoryKey: "Math" | "Reasoning" | "GK" = "GK";
    const cat = category.toLowerCase();
    if (cat.includes('math') || cat.includes('banking') || cat.includes('gate')) categoryKey = "Math";
    else if (cat.includes('reasoning') || cat.includes('ssc')) categoryKey = "Reasoning";
    
    const source = localQuestions[categoryKey] || localQuestions.GK;
    
    // Shuffle and pick
    const selected = [...source].sort(() => 0.5 - Math.random()).slice(0, count).map((q, i) => ({
      ...q,
      id: `local-${Date.now()}-${i}`
    }));
    
    // Pad if needed
    while (selected.length < count && selected.length > 0) {
      const randomQ = selected[Math.floor(Math.random() * selected.length)];
      selected.push({ ...randomQ, id: `local-pad-${Date.now()}-${selected.length}` });
    }
    
    return selected;
  };

  const handleGenerate = async () => {
    if (!user) { navigate('/login'); return; }
    if (isRestricted) { setShowUpgradeModal(true); return; }

    const pdfTextLength = extractedText?.trim().length || 0;
    console.log('📄 PDF TEXT LENGTH:', pdfTextLength);

    if (pdfTextLength < 50 && generationMethod === 'upload') {
      alert('Please upload a valid PDF first. The extracted text is too short.');
      setUploadStatus('idle');
      return;
    }

    // SAFETY TIMEOUT: Hard 20-second reset if spinner gets stuck
    const safetyTimer = setTimeout(() => {
      setIsGenerating(prev => {
        if (prev) {
          console.warn('[Safety] 120s timeout hit — force-stopping spinner.');
          setGenerationError('AI is taking longer than usual due to high demand. Fallback questions active.');
          return false;
        }
        return prev;
      });
    }, 120000);

    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedPaper(null); // clear old result

    try {
      const cacheKey = `${selectedType}-${numQuestions}-${selectedCategory}-${extractedText.substring(0, 100)}`;
      let generatedQuestions: any[] = [];

      if (generationCache[cacheKey]) {
        generatedQuestions = generationCache[cacheKey];
        console.log('[App] ✅ Cache hit — using cached questions.');
      } else {
        console.log(`[App] 🚀 Calling PreExamWale Service (Text Length: ${extractedText.length})...`);
        const startTime = Date.now();

        const result = await generateQuestionsFromText(
          extractedText,
          numQuestions,
          selectedType,
          selectedCategory,
          selectedLanguage
        );

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`🎯 AI RESULT RECEIVED (${duration}s):`, { fromFallback: result.fromFallback, count: result.questions.length, error: result.error });

        if (!result.questions || result.questions.length === 0) {
          throw new Error('AIService returned empty questions array');
        }

        generatedQuestions = result.questions;

        if (result.fromFallback) {
          const errorMsg = result.error === 'TIMEOUT' 
            ? "AI took too long (>45s). Fallback questions active." 
            : (result.errorMessage || "AI busy hai, fallback questions active.");
          console.log("[App] AI Issue reported:", errorMsg);
          setGenerationError(errorMsg);
        }

        if (!result.fromFallback) {
          setGenerationCache(prev => ({ ...prev, [cacheKey]: generatedQuestions }));
        }
      }

      const paperName = uploadFile?.name.replace('.pdf', '') || `${selectedCategory} Practice Paper`;

      // ✅ IMMEDIATELY set generatedPaper so UI renders right now
      const freshPaper = { name: paperName, questions: generatedQuestions };
      setGeneratedPaper(freshPaper);
      console.log('🖥️ RENDER TRIGGERED — questions set:', generatedQuestions.length);

      // Background Firestore save (doesn't block UI)
      const newPaperData = {
        name: paperName,
        type: selectedType,
        questions: generatedQuestions.length,
        time: generatedQuestions.length,
        date: new Date().toISOString(),
        status: 'completed' as const,
        uid: user.uid,
        category: selectedCategory,
        content: generatedQuestions
      };

      addDoc(collection(db, 'papers'), newPaperData).then(docRef => {
        setActivePaperId(docRef.id);
        console.log('[App] Firestore save OK:', docRef.id);
      }).catch(fsErr => {
        console.warn('[App] Firestore save failed (offline mode):', fsErr);
        setActivePaperId(`local-${Date.now()}`);
      });

      setUploadStatus('generated');

    } catch (error: any) {
      console.error('[App] 🔴 handleGenerate critical error:', error);

      // FINAL SAFETY: even on crash, show fallback questions
      const { getFallbackForCrash } = {
        getFallbackForCrash: () => {
          const fallbacks = [
            { id: 'f1', text: 'The Indian Constitution came into force on?', options: ['26 Jan 1950', '15 Aug 1947', '2 Oct 1949', '1 Jan 1950'], correctAnswer: 0, topic: 'Polity' },
            { id: 'f2', text: 'Who is known as the Missile Man of India?', options: ['S. Chandrasekhar', 'Vikram Sarabhai', 'APJ Abdul Kalam', 'Homi Bhabha'], correctAnswer: 2, topic: 'Science' },
            { id: 'f3', text: 'What is the capital of India?', options: ['Mumbai', 'Kolkata', 'Chennai', 'New Delhi'], correctAnswer: 3, topic: 'GK' },
            { id: 'f4', text: 'Which river is the longest in India?', options: ['Yamuna', 'Ganga', 'Brahmaputra', 'Godavari'], correctAnswer: 1, topic: 'Geography' },
            { id: 'f5', text: 'Photosynthesis uses which gas?', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Helium'], correctAnswer: 2, topic: 'Biology' },
          ];
          return fallbacks;
        }
      };
      const crashFallback = getFallbackForCrash();
      setGeneratedPaper({ name: 'Emergency Paper', questions: crashFallback });
      setGenerationError('Paper generation failed — showing sample questions. Please retry.');
    } finally {
      clearTimeout(safetyTimer);
      setIsGenerating(false);
    }
  };

  const startTest = (paperId: string) => {
    const paper = papers.find(p => p.id === paperId);
    if (paper && paper.content) {
      setCurrentQuestions(paper.content);
      setActivePaperId(paperId);
      setTimeLeft(paper.time * 60);
      setIsTesting(true);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setSkippedQuestions(new Set());
      setTestStartTime(Date.now());
      setTestResults(null);
    }
  };

  const [showQuitModal, setShowQuitModal] = useState(false);

  const quitTest = () => {
    setShowQuitModal(true);
  };

  const confirmQuit = () => {
    setShowQuitModal(false);
    submitTest();
  };

  const skipQuestion = () => {
    setSkippedQuestions(prev => new Set(prev).add(currentQuestionIndex));
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const submitTest = async () => {
    if (!activePaperId) return;

    const timeTaken = Math.floor((Date.now() - testStartTime) / 1000);
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    const topics: Record<string, { correct: number; total: number }> = {};

    currentQuestions.forEach((q, index) => {
      const answer = userAnswers[index];
      const isCorrect = answer === q.correctAnswer;
      
      if (answer === undefined) {
        skipped++;
      } else if (isCorrect) {
        correct++;
      } else {
        wrong++;
      }
      
      if (!topics[q.topic]) topics[q.topic] = { correct: 0, total: 0 };
      topics[q.topic].total++;
      if (isCorrect) topics[q.topic].correct++;
    });

    const accuracy = Math.round((correct / currentQuestions.length) * 100);

    const results = {
      score: correct,
      total: currentQuestions.length,
      correct,
      wrong,
      skipped,
      accuracy,
      timeTaken,
      analysis: {
        strongTopics: Object.entries(topics).filter(([_, v]) => (v.correct / v.total) >= 0.7).map(([k]) => k),
        weakTopics: Object.entries(topics).filter(([_, v]) => (v.correct / v.total) < 0.7).map(([k]) => k),
      }
    };

    setTestResults(results);
    setIsTesting(false);

    try {
      await setDoc(doc(db, 'papers', activePaperId), {
        status: 'completed'
      }, { merge: true });
    } catch (error) {
      console.error('Error updating paper status:', error);
    }
  };

  const addToLeaderboard = async () => {
    if (!testResults || !activePaperId) return;
    
    try {
      await addDoc(collection(db, 'leaderboard'), {
        uid: user?.uid,
        displayName: user?.displayName || 'Anonymous',
        photoURL: user?.photoURL || '',
        score: testResults.score,
        total: testResults.total,
        accuracy: testResults.accuracy,
        timeTaken: testResults.timeTaken,
        paperId: activePaperId,
        paperName: papers.find(p => p.id === activePaperId)?.name || 'Exam Paper',
        timestamp: new Date().toISOString()
      });
      alert('Score added to leaderboard!');
    } catch (error) {
      console.error('Error adding to leaderboard:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async (paperId: string) => {
    const paper = papers.find(p => p.id === paperId);
    if (!paper) return;

    console.log("Downloading paper:", paper.id);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(24, 24, 27);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('PreExamWale.in', 20, 25);
      doc.setFontSize(10);
      doc.text('AI Generated Practice Paper', 20, 32);
      
      doc.setTextColor(24, 24, 27);
      doc.setFontSize(14);
      doc.text(`Subject: ${paper.name}`, 20, 55);
      doc.setFontSize(10);
      doc.text(`Total Questions: ${paper.questions} | Time: ${paper.time} Mins`, 20, 62);
      
      let y = 75;
      const questions = paper.content || [];
      
      if (questions.length === 0) {
        throw new Error("No questions available in this paper.");
      }

      questions.forEach((q, i) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(11);
        doc.text(`Q${i + 1}. ${q.text}`, 20, y, { maxWidth: 170 });
        y += 10;
        if (q.options && Array.isArray(q.options)) {
          q.options.forEach((opt, oi) => {
            if (y > 280) {
              doc.addPage();
              y = 20;
            }
            doc.setFontSize(10);
            doc.text(`(${String.fromCharCode(65 + oi)}) ${opt}`, 30, y, { maxWidth: 160 });
            y += 7;
          });
        }
        y += 5;
      });
      
      console.log("Saving PDF as:", `${paper.name}.pdf`);
      doc.save(`${paper.name}.pdf`);
      alert("Paper downloaded successfully!");
    } catch (error: any) {
      console.error('Download error:', error);
      alert('Failed to download PDF: ' + (error.message || 'Unknown error'));
    }
  };

  // Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTesting && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            submitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTesting]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const questionTypes: { id: QuestionType; label: string; icon: any }[] = [
    { id: 'MCQ', label: 'MCQ', icon: Layout },
    { id: 'Short', label: 'Short', icon: FileText },
    { id: 'Long', label: 'Long', icon: BookOpen },
    { id: 'True-False', label: 'True-False', icon: CheckCircle2 },
    { id: 'Assumption', label: 'Assumption', icon: Zap },
  ];

  const ADMIN_EMAIL = 'rstenguriya16@gmail.com'; 
  const isAdmin = user?.email === ADMIN_EMAIL;

  const sidebarItems: { id: string; label: string; icon: any; action?: () => void }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'generate', label: 'Generate Paper', icon: PlusCircle },
    { id: 'blog', label: 'Exam News & Jobs', icon: BookOpen },
    ...(isAdmin ? [
      { id: 'admin-dashboard', label: 'Admin Panel', icon: Lock }
    ] : [])
  ];

  const adminNavItems = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: Layout },
    { id: 'admin-blogs', label: 'Blogs', icon: FileText },
    { id: 'admin-categories', label: 'Categories', icon: Book },
    { id: 'admin-pages', label: 'Pages', icon: MessageSquare },
    { id: 'admin-ads', label: 'Ad Manager', icon: Zap },
  ];

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Removed global !user redirect to allow public routes.
  // Instead, individual protected routes will handle redirects.

  return (
    <div className="min-h-screen bg-brand-bg font-sans selection:bg-brand-primary/20 selection:text-brand-primary">
      {/* Loading Screen */}
      <AnimatePresence>
        {isGenerating && <LoadingScreen />}
      </AnimatePresence>

      {/* Top Navbar */}
      {!isTesting && (
        <nav className="sticky top-0 z-[60] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div 
              className="cursor-pointer"
              onClick={() => setActiveTab('dashboard')}
            >
              <Logo />
            </div>

            <div className="hidden md:flex items-center gap-1 bg-zinc-100/50 p-1 rounded-2xl">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    if ('action' in item && item.action) {
                      item.action();
                      return;
                    }
                    setActiveTab(item.id as Tab);
                    if (item.id === 'generate') setUploadStatus('idle');
                  }}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                    activeTab === item.id 
                    ? 'bg-white text-brand-primary shadow-sm ring-1 ring-zinc-200' 
                    : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 1.5} />
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={toggleDarkMode}
                className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
                title="Toggle Dark Mode"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {user && user.email !== 'guest@preexamwale.in' ? (
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-xs font-black text-zinc-900">{user.displayName}</span>
                    <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">{papersCount}/10 Papers</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-md ring-1 ring-zinc-100">
                    <img src={user.photoURL || ''} alt="avatar" referrerPolicy="no-referrer" />
                  </div>
                  <button 
                    onClick={() => {
                        auth.signOut();
                        localStorage.removeItem('guest_uid');
                        window.location.reload();
                    }}
                    className="p-2.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Logout"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => navigate('/login')}
                  className="btn-primary px-8 py-2.5 text-sm"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Exam Category Toggle (Only on Dashboard) */}
      {!isTesting && activeTab === 'dashboard' && (
        <div className="bg-white border-b border-zinc-100 overflow-x-auto no-scrollbar">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest whitespace-nowrap mr-4">Categories</span>
            {EXAM_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                  ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/20'
                  : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="flex-grow pt-24 pb-20 relative px-6 md:px-12">
        <AnimatePresence mode="wait">
          <div key={location.pathname}>
            <Routes location={location}>
            <Route path="/" element={<PublicHome blogs={blogs} onStart={() => navigate('/practice')} />} />
            <Route path="/blog" element={<BlogList blogs={blogs} />} />
            <Route path="/blog/:slug" element={<BlogDetail blogs={blogs} adSettings={adSettings} />} />
            <Route path="/login" element={user ? <Navigate to={user.email === 'rstenguriya16@gmail.com' ? '/admin' : '/practice'} replace /> : <Login />} />
            
            {/* Legal Pages */}
            <Route path="/about" element={<PageLoader pages={dbPages} />} />
            <Route path="/contact" element={<PageLoader pages={dbPages} />} />
            <Route path="/privacy-policy" element={<PageLoader pages={dbPages} />} />
            <Route path="/terms" element={<PageLoader pages={dbPages} />} />

            {/* Protected Practice Routes */}
            <Route path="/practice" element={
              user ? (
                <div className="animate-in fade-in duration-500">
                  {isTesting ? (
                    <motion.div key="test" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="max-w-5xl mx-auto space-y-10">
                        {/* Test Header */}
                        <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-sm border border-zinc-100 dark:border-zinc-800">
                           <div className="flex items-center gap-6">
                             <button onClick={() => setShowQuitModal(true)} className="p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-2xl text-zinc-400 transition-colors" title="Quit Test" aria-label="Quit Test">
                               <ChevronLeft size={24} />
                             </button>
                             <div>
                               <h3 className="text-xl font-display font-black text-zinc-900 dark:text-white">Live Test: {papers.find(p => p.id === activePaperId)?.name}</h3>
                               <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">{currentQuestions.length} Questions</p>
                             </div>
                           </div>
                           <div className={`flex items-center gap-4 px-6 py-3 rounded-2xl font-display font-black text-xl ${timeLeft < 60 ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-emerald-50 text-brand-primary'}`}>
                             <Timer size={24} />
                             {formatTime(timeLeft)}
                           </div>
                        </div>

                        {/* Question Area */}
                        <div className="premium-card p-12 space-y-10">
                          <div className="space-y-4">
                            <span className="text-xs font-black text-brand-primary uppercase tracking-widest">Question {currentQuestionIndex + 1} of {currentQuestions.length}</span>
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white leading-relaxed">{currentQuestions[currentQuestionIndex]?.text}</h2>
                          </div>
                          <div className="space-y-4">
                            {currentQuestions[currentQuestionIndex]?.options.map((opt, idx) => (
                              <button 
                                key={idx} 
                                onClick={() => setUserAnswers({...userAnswers, [currentQuestionIndex]: idx})} 
                                className={`w-full p-6 rounded-3xl border-2 text-left transition-all ${userAnswers[currentQuestionIndex] === idx ? 'border-brand-primary bg-emerald-50 dark:bg-emerald-900/10' : 'border-zinc-50 dark:border-zinc-800 dark:bg-zinc-900'}`}
                              >
                                <span className="flex items-center gap-4">
                                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${userAnswers[currentQuestionIndex] === idx ? 'bg-brand-primary text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                                    {String.fromCharCode(65 + idx)}
                                  </span>
                                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{opt}</span>
                                </span>
                              </button>
                            ))}
                          </div>
                          <div className="flex justify-between pt-6 border-t border-zinc-50 dark:border-zinc-800">
                            <button onClick={() => setCurrentQuestionIndex(prev => prev - 1)} disabled={currentQuestionIndex === 0} className="px-8 py-4 text-xs font-black uppercase text-zinc-400 disabled:opacity-30">Prev</button>
                            <button onClick={submitTest} className="btn-primary px-12 py-4 shadow-xl shadow-brand-primary/20">Submit Test</button>
                            <button onClick={() => setCurrentQuestionIndex(prev => prev + 1)} disabled={currentQuestionIndex === currentQuestions.length - 1} className="px-8 py-4 text-xs font-black uppercase text-brand-primary disabled:opacity-30">Next</button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : testResults ? (
                    <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="max-w-4xl mx-auto text-center space-y-12">
                        <div className="w-24 h-24 bg-emerald-50 text-brand-primary rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                          <Award size={48} />
                        </div>
                        <h2 className="text-4xl font-display font-black text-zinc-900 dark:text-white">Test Completed!</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                           <div className="premium-card p-6"><p className="text-[10px] font-black text-zinc-400 uppercase">Score</p><h3 className="text-2xl font-black">{testResults.score}/{testResults.total}</h3></div>
                           <div className="premium-card p-6"><p className="text-[10px] font-black text-zinc-400 uppercase">Accuracy</p><h3 className="text-2xl font-black text-brand-primary">{testResults.accuracy}%</h3></div>
                           <div className="premium-card p-6"><p className="text-[10px] font-black text-zinc-400 uppercase">Correct</p><h3 className="text-2xl font-black text-emerald-500">{testResults.correct}</h3></div>
                           <div className="premium-card p-6"><p className="text-[10px] font-black text-zinc-400 uppercase">Time</p><h3 className="text-2xl font-black text-blue-500">{formatTime(testResults.timeTaken)}</h3></div>
                        </div>
                        <div className="flex justify-center gap-4">
                          <button onClick={() => { setTestResults(null); navigate('/practice'); }} className="btn-primary px-12 py-4">New Practice</button>
                          <button onClick={() => navigate('/history')} className="px-12 py-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl font-black uppercase tracking-widest">History</button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="max-w-5xl mx-auto space-y-12">
                       <div className="text-center space-y-4">
                         <h2 className="text-5xl font-display font-black text-zinc-900 dark:text-white">Ready to <span className="text-brand-primary">Practice?</span></h2>
                         <p className="text-zinc-500 dark:text-zinc-400 text-lg">Pick a category or upload your PDF to generate a custom paper.</p>
                       </div>
                       
                       {/* Generation Cards */}
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         {['General Knowledge', 'Mathematics', 'Reasoning'].map((c, i) => (
                           <button 
                             key={c} 
                             onClick={() => { setSelectedType('MCQ'); setSelectedCategory(c === 'General Knowledge' ? 'GK' : c); startTest('local'); }} 
                             className="premium-card p-10 hover:border-brand-primary transition-all group relative overflow-hidden"
                           >
                             <div className="absolute top-0 right-0 p-6 text-zinc-100 dark:text-zinc-800 group-hover:text-brand-primary/10 transition-colors">
                               {i === 0 ? <Globe size={80} /> : i === 1 ? <Calculator size={80} /> : <Zap size={80} />}
                             </div>
                             <h3 className="text-3xl font-black mb-4 group-hover:text-brand-primary transition-colors relative z-10">{c}</h3>
                             <p className="text-zinc-500 text-sm relative z-10">Targeted preparation for competitive exams.</p>
                             <div className="mt-8 flex items-center gap-2 text-brand-primary font-black text-xs uppercase opacity-0 group-hover:opacity-100 transition-all relative z-10">
                               Start Practice <ArrowRight size={16} />
                             </div>
                           </button>
                         ))}
                       </div>

                        {/* Books Section */}
                        <BooksSection onSelectBook={(book) => {
                          setSelectedCategory(book.category);
                          setSelectedBook(book);
                          navigate('/generate');
                        }} />

                        {/* PDF Upload Section */}
                       <div className="premium-card p-12 bg-zinc-900 border-none shadow-2xl relative overflow-hidden group cursor-pointer" onClick={() => navigate('/generate')}>
                         <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                           <div className="space-y-4 text-center md:text-left">
                             <h3 className="text-3xl font-display font-black text-white">Generate from PDF</h3>
                             <p className="text-white/60 max-w-md">Upload your notes or specific books, and our AI will create a tailor-made exam paper for you instantly.</p>
                           </div>
                           <div className="w-20 h-20 bg-brand-primary rounded-3xl flex items-center justify-center text-white shadow-xl shadow-brand-primary/20 group-hover:scale-110 transition-transform">
                             <Upload size={32} />
                           </div>
                         </div>
                       </div>

                       {/* Your Practice Papers — Grouped by Category */}
                       <div className="mt-24 space-y-12">
                         <div className="flex items-end justify-between">
                           <div className="space-y-4">
                             <span className="text-xs font-black text-brand-primary uppercase tracking-[0.2em]">Your Progress</span>
                             <h2 className="text-4xl md:text-5xl font-display font-black text-zinc-900 dark:text-white">Practice <span className="text-brand-primary">History</span></h2>
                           </div>
                         </div>

                         {papers.length === 0 ? (
                           <div className="premium-card p-20 text-center space-y-6 bg-zinc-50 dark:bg-zinc-900/50 border-dashed border-zinc-200 dark:border-zinc-800">
                             <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-300">
                               <FileText size={40} />
                             </div>
                             <div className="space-y-2">
                               <h3 className="text-xl font-bold text-zinc-400">No papers yet</h3>
                               <p className="text-zinc-500 text-sm">Upload a PDF or select a book to start practicing.</p>
                             </div>
                           </div>
                         ) : (
                           <div className="space-y-16">
                             {Object.entries(
                               papers.reduce((acc: any, paper) => {
                                 const cat = paper.category || 'General';
                                 if (!acc[cat]) acc[cat] = [];
                                 acc[cat].push(paper);
                                 return acc;
                               }, {})
                             ).map(([category, catPapers]: [string, any]) => (
                               <div key={category} className="space-y-8">
                                 <div className="flex items-center gap-4">
                                   <div className="h-px flex-grow bg-zinc-100 dark:bg-zinc-800" />
                                   <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                     <div className="w-2 h-2 rounded-full bg-brand-primary" />
                                     {category}
                                   </h3>
                                   <div className="h-px flex-grow bg-zinc-100 dark:bg-zinc-800" />
                                 </div>
                                 
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                   {catPapers.map((paper: any) => (
                                     <motion.div 
                                       key={paper.id}
                                       whileHover={{ y: -5 }}
                                       className="premium-card group hover:border-brand-primary/30 transition-all p-8 flex flex-col justify-between"
                                     >
                                       <div className="space-y-6">
                                         <div className="flex justify-between items-start">
                                           <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors shadow-sm">
                                             <FileText size={22} />
                                           </div>
                                           <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{new Date(paper.date).toLocaleDateString()}</span>
                                         </div>
                                         <div>
                                           <h4 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 line-clamp-1 group-hover:text-brand-primary transition-colors">{paper.name}</h4>
                                           <div className="flex gap-4 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                                             <span className="flex items-center gap-1.5"><List size={14} className="text-brand-primary" /> {paper.questions?.length || paper.questions} Qs</span>
                                             <span className="flex items-center gap-1.5"><Target size={14} className="text-brand-primary" /> MCQ</span>
                                           </div>
                                         </div>
                                       </div>
                                       
                                       <div className="mt-8 flex gap-3">
                                         <button 
                                           onClick={() => {
                                             setCurrentQuestions(paper.questions);
                                             setActivePaperId(paper.id);
                                             setIsTesting(true);
                                             setCurrentQuestionIndex(0);
                                             setUserAnswers({});
                                             setTestStartTime(Date.now());
                                             setTimeLeft((paper.questions?.length || paper.questions) * 60);
                                           }}
                                           className="flex-grow py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-primary dark:hover:bg-brand-primary hover:text-white transition-all shadow-lg shadow-zinc-900/10"
                                         >
                                           Start Retest
                                         </button>
                                       </div>
                                     </motion.div>
                                   ))}
                                 </div>
                               </div>
                             ))}
                           </div>
                         )}
                       </div>
                    </div>
                  )}
                </div>
              ) : <Navigate to="/login" replace />
            } />

            {/* Admin Routes */}
            <Route path="/admin/*" element={isAdmin ? (
              <div className="space-y-10">
                <div className="flex gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-6 overflow-x-auto no-scrollbar">
                  {adminNavItems.map((item) => (
                    <button 
                      key={item.id} 
                      onClick={() => {
                        // We use the tab state for admin sub-views
                        if (item.id === 'admin-dashboard') navigate('/admin');
                        else navigate(`/admin/${item.id.replace('admin-', '')}`);
                      }} 
                      className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${location.pathname.includes(item.id.replace('admin-', '')) || (location.pathname === '/admin' && item.id === 'admin-dashboard') ? 'bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white shadow-xl' : 'bg-white dark:bg-zinc-900 text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                    >
                      <span className="flex items-center gap-2">
                        <item.icon size={16} />
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
                {/* Admin Sub-Routes */}
                <Routes>
                  <Route index element={<AdminDashboard blogs={blogs} pages={dbPages} adSettings={adSettings} setActiveTab={setActiveTab} />} />
                  <Route path="blogs" element={<AdminBlogs blogs={blogs} />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="pages" element={<AdminPages pages={dbPages} />} />
                  <Route path="ads" element={<AdminAds adSettings={adSettings} />} />
                </Routes>
              </div>
            ) : <Navigate to="/" replace />} />

            <Route path="/generate" element={user ? (
              <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-500">
                <div className="text-center space-y-4">
                  <h2 className="text-4xl md:text-5xl font-display font-black text-zinc-900 dark:text-white">Generate with <span className="text-brand-primary">PreExamWale</span></h2>
                  <p className="text-zinc-900 dark:text-zinc-100 font-bold text-lg">Upload your PDF study material to create a custom practice paper instantly.</p>
                </div>
                
                {/* Upload + Settings — always visible unless paper is generated */}
                {!generatedPaper && (
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Upload Area */}
                    <div className="premium-card p-8 bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800 rounded-[2.5rem]">
                      <h3 className="text-xl font-bold mb-6 text-zinc-900 dark:text-white">1. Upload Material</h3>
                      <div 
                        className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all ${isDragging ? 'border-brand-primary bg-brand-primary/5' : 'border-zinc-300 dark:border-zinc-700'}`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          const file = e.dataTransfer.files[0];
                          if (file?.type === 'application/pdf') handleUpload(file);
                          else alert('Please upload a PDF file');
                        }}
                      >
                        <Upload size={48} className={`mx-auto mb-4 ${uploadStatus === 'ready' ? 'text-emerald-500' : 'text-zinc-400'}`} />
                        {uploadStatus === 'uploading' ? (
                          <p className="text-brand-primary font-bold animate-pulse">Extracting text from PDF...</p>
                        ) : uploadStatus === 'ready' ? (
                          <p className="text-emerald-500 font-bold">✓ {uploadFile?.name} ready</p>
                        ) : (
                          <div className="space-y-2">
                            <p className="font-bold text-zinc-800 dark:text-zinc-100">Drag & drop your PDF here</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">or</p>
                            <label className="cursor-pointer inline-block bg-zinc-900 dark:bg-white px-8 py-3 rounded-xl text-sm font-black transition-all hover:scale-105 active:scale-95 text-white dark:text-zinc-900 shadow-lg">
                              Browse Files
                              <input 
                                type="file" 
                                accept=".pdf" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUpload(file);
                                }} 
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Settings Area */}
                    <div className="premium-card p-8 bg-zinc-900 text-white shadow-2xl rounded-[2.5rem] space-y-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10"><Zap size={100} /></div>
                      <h3 className="text-xl font-bold mb-6 relative z-10">2. Paper Settings</h3>
                      
                      <div className="space-y-4 relative z-10">
                        <div>
                          <label className="text-xs font-black text-white/50 uppercase tracking-widest block mb-2">Category</label>
                          <select 
                            aria-label="Select Category"
                            value={selectedCategory} 
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full bg-black/30 border-2 border-transparent focus:border-brand-primary rounded-xl px-4 py-3 outline-none transition-all font-medium text-white"
                          >
                            {EXAM_CATEGORIES.filter(c => c.id !== 'all').map(c => (
                              <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-black text-white/50 uppercase tracking-widest block mb-2">Language</label>
                            <select 
                              aria-label="Select Language"
                              value={selectedLanguage || 'English'} 
                              onChange={(e) => setSelectedLanguage(e.target.value)}
                              className="w-full bg-black/30 border-2 border-transparent focus:border-brand-primary rounded-xl px-4 py-3 outline-none transition-all font-medium text-white"
                            >
                              <option value="English">English</option>
                              <option value="Hindi">Hindi</option>
                              <option value="Bilingual">Bilingual</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-black text-white/50 uppercase tracking-widest block mb-2">Exam Type</label>
                            <select 
                              aria-label="Select Exam Type"
                              value={selectedType} 
                              onChange={(e) => setSelectedType(e.target.value as QuestionType)}
                              className="w-full bg-black/30 border-2 border-transparent focus:border-brand-primary rounded-xl px-4 py-3 outline-none transition-all font-medium text-white"
                            >
                              <option value="MCQ">MCQ (Normal)</option>
                              <option value="Assumption">Assertion & Reason</option>
                              <option value="Short">Short Answer</option>
                              <option value="True-False">True/False</option>
                            </select>
                          </div>
                        </div>

                        <div>
                           <div className="flex justify-between items-center mb-2">
                             <label className="text-xs font-black text-white/50 uppercase tracking-widest">Number of Questions</label>
                             <span className="text-brand-primary font-black">{numQuestions}</span>
                           </div>
                           <input aria-label="Number of Questions" type="range" min="5" max="120" step="5" value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} className="w-full accent-brand-primary h-2 bg-white/10 rounded-lg appearance-none cursor-pointer" />
                           <div className="flex justify-between mt-1">
                             <span className="text-[10px] font-bold text-white/30">5</span>
                             <span className="text-[10px] font-bold text-white/30">120</span>
                           </div>
                        </div>
                      </div>

                      {/* Generation Error Banner */}
                      {generationError && (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-sm text-amber-300 font-medium flex items-start gap-3 relative z-10">
                          <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-400" />
                          <div className="flex-1">
                            <p>{generationError}</p>
                            <button
                              onClick={() => { setGenerationError(null); setGeneratedPaper(null); handleGenerate(); }}
                              className="mt-2 text-xs font-black text-amber-400 uppercase tracking-widest hover:underline"
                            >
                              ↺ Retry with PreExamWale
                            </button>
                          </div>
                        </div>
                      )}

                      <button 
                        onClick={handleGenerate}
                        disabled={uploadStatus !== 'ready' || isGenerating}
                        className="w-full py-4 mt-6 bg-brand-primary text-white hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 relative z-10"
                      >
                        {isGenerating 
                          ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> PreExamWale generate kar raha hai...</>
                          : <><Zap size={18} /> Generate Paper</>}
                      </button>
                    </div>
                  </div>
                )}

                {generatedPaper && generatedPaper.questions.length > 0 && (
                  <motion.div
                    key="paper-result"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    {/* Success Header */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-8 bg-brand-primary/5 dark:bg-brand-primary/10 border-2 border-brand-primary/20 rounded-3xl">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-brand-primary text-white rounded-2xl flex items-center justify-center shrink-0">
                          <CheckCircle2 size={28} />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-zinc-900 dark:text-white">✅ Paper Generated!</h3>
                          <p className="text-brand-primary font-bold">{generatedPaper.name} — {generatedPaper.questions.length} questions ready</p>
                        </div>
                      </div>
                      <div className="flex gap-3 flex-wrap justify-center">
                        <button
                          onClick={() => {
                            const paperWithContent = {
                              ...generatedPaper,
                              id: activePaperId || `p-${Date.now()}`,
                              category: selectedCategory,
                              date: new Date().toISOString()
                            };
                            setCurrentQuestions(generatedPaper.questions);
                            setActivePaperId(paperWithContent.id);
                            setTestResults(null);
                            setCurrentQuestionIndex(0);
                            setUserAnswers({});
                            setTestStartTime(Date.now());
                            setTimeLeft(generatedPaper.questions.length * 60);
                            setIsTesting(true);
                          }}
                          className="px-6 py-3 bg-brand-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-brand-primary/90 transition-all flex items-center gap-2 shadow-xl shadow-brand-primary/20"
                        >
                          <Play size={16} /> Start Test Now
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const { jsPDF } = await import('jspdf');
                              const doc = new jsPDF();
                              
                              // Brand Header
                              doc.setFillColor(24, 24, 27);
                              doc.rect(0, 0, 210, 40, 'F');
                              doc.setTextColor(255, 255, 255);
                              doc.setFontSize(22);
                              doc.setFont('helvetica', 'bold');
                              doc.text('PreExamWale.in', 20, 20);
                              doc.setFontSize(10);
                              doc.setFont('helvetica', 'normal');
                              doc.text(`India's most advanced exam preparation platform`, 20, 28);
                              doc.setFontSize(11);
                              doc.text(`Subject: ${generatedPaper.name} | Questions: ${generatedPaper.questions.length} | Category: ${selectedCategory}`, 20, 35);
                              
                              doc.setTextColor(24, 24, 27);
                              let y = 55;
                              
                              // Questions
                              generatedPaper.questions.forEach((q: any, i: number) => {
                                if (y > 260) { doc.addPage(); y = 20; }
                                doc.setFont('helvetica', 'bold');
                                doc.setFontSize(11);
                                doc.text(`Q${i + 1}. ${q.text}`, 20, y, { maxWidth: 170 });
                                y += 10;
                                
                                doc.setFont('helvetica', 'normal');
                                doc.setFontSize(10);
                                (q.options || []).forEach((opt: string, oi: number) => {
                                  if (y > 275) { doc.addPage(); y = 20; }
                                  doc.text(`(${String.fromCharCode(65 + oi)}) ${opt}`, 28, y, { maxWidth: 162 });
                                  y += 7;
                                });
                                y += 5;
                              });

                              // Answer Key Page
                              doc.addPage();
                              doc.setFillColor(24, 24, 27);
                              doc.rect(0, 0, 210, 30, 'F');
                              doc.setTextColor(255, 255, 255);
                              doc.setFontSize(18);
                              doc.setFont('helvetica', 'bold');
                              doc.text('Answer Key (Solutions)', 20, 20);

                              doc.setTextColor(24, 24, 27);
                              y = 45;
                              generatedPaper.questions.forEach((q: any, i: number) => {
                                if (y > 270) { doc.addPage(); y = 30; }
                                doc.setFont('helvetica', 'bold');
                                doc.text(`Q${i + 1}: (${String.fromCharCode(65 + q.correctAnswer)})`, 20, y);
                                y += 8;
                              });

                              doc.save(`${generatedPaper.name}_PreExamWale.pdf`);
                              alert('Paper with Answer Key downloaded successfully!');
                            } catch(e: any) {
                              alert('Download failed: ' + e.message);
                            }
                          }}
                          className="px-6 py-3 bg-zinc-900 text-white dark:bg-zinc-700 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-2"
                        >
                          <Download size={16} /> Download PDF + Key
                        </button>
                        <button
                          onClick={() => { setGeneratedPaper(null); setUploadStatus('idle'); setUploadFile(null); setExtractedText(''); setGenerationError(null); }}
                          className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                        >
                          Generate Another
                        </button>
                      </div>
                    </div>

                    {/* Paper Content Preview (UI) */}
                    <div className="premium-card p-12 bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800 rounded-[3rem] space-y-12">
                      <div className="space-y-12">
                        {generatedPaper.questions.map((q, i) => (
                          <div key={i} className="space-y-6">
                            <div className="flex gap-4">
                              <span className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white flex items-center justify-center font-black shrink-0">{i + 1}</span>
                              <div className="space-y-4 flex-1">
                                <h4 className="text-xl font-bold text-zinc-900 dark:text-white leading-relaxed">{q.text}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {q.options.map((opt: string, idx: number) => (
                                    <div key={idx} className="p-4 rounded-2xl border-2 border-zinc-50 dark:border-zinc-800 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                      <span className="mr-3 font-black text-brand-primary">{String.fromCharCode(65 + idx)})</span> {opt}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Answer Key (UI) */}
                      <div className="mt-20 pt-12 border-t-4 border-zinc-900 dark:border-white">
                        <h3 className="text-3xl font-display font-black text-zinc-900 dark:text-white mb-8 flex items-center gap-4">
                          <CheckCircle2 size={32} className="text-brand-primary" />
                          Solution Key
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                          {generatedPaper.questions.map((q, i) => (
                            <div key={i} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-between">
                              <span className="font-black text-zinc-400">Q{i + 1}</span>
                              <span className="w-8 h-8 rounded-lg bg-brand-primary text-white flex items-center justify-center font-black">
                                {String.fromCharCode(65 + q.correctAnswer)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : <Navigate to="/login" replace />} />
            
            <Route path="/history" element={user ? (
               <Navigate to="/practice" replace /> 
            ) : <Navigate to="/login" replace />} />

            {/* Admin standalone panel (has its own full-page layout) */}
            <Route path="/admin-panel" element={<AdminPanel />} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
        </AnimatePresence>
        {user && !isAdminMode && selectedCategory !== 'all' && <LiveChat currentUser={user} category={selectedCategory} />}
      </main>

      {/* Quit Confirmation Modal */}
      <AnimatePresence>
        {showQuitModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
              onClick={() => setShowQuitModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl space-y-8 text-center"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto">
                <AlertTriangle size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-display font-black text-zinc-900">Quit Test?</h3>
                <p className="text-zinc-500 font-medium leading-relaxed">
                  Your current progress will be submitted and you'll see your results based on answered questions.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmQuit}
                  className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-red-500/20"
                >
                  Yes, Submit & Quit
                </button>
                <button 
                  onClick={() => setShowQuitModal(false)}
                  className="w-full py-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-2xl font-black uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpgradeModal(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Left Side - Info */}
                <div className="p-12 bg-zinc-900 text-white space-y-8">
                  <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center">
                    <Zap size={24} fill="currentColor" />
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-3xl font-display font-black leading-tight">Unlock Your Full Potential</h3>
                    <p className="text-white/60 text-sm font-medium leading-relaxed">
                      You've reached your free limit. Join 10,000+ students using AI to ace their exams.
                    </p>
                  </div>
                  <ul className="space-y-4">
                    {[
                      'Unlimited PreExamWale Paper Generation',
                      'Advanced Performance Analytics',
                      'Priority AI Support',
                      'Ad-free Experience'
                    ].map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-xs font-bold text-white/80">
                        <CheckCircle2 size={16} className="text-brand-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Right Side - Pricing */}
                <div className="p-12 space-y-8">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Pricing Plans</span>
                    <h4 className="text-2xl font-display font-black text-zinc-900">Choose your path</h4>
                  </div>

                  <div className="space-y-4">
                    {/* Pay Per Use */}
                    <button className="w-full p-6 rounded-3xl border-2 border-zinc-50 hover:border-brand-primary transition-all text-left group">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-black text-zinc-900">Pay Per Paper</span>
                        <span className="text-xl font-display font-black text-brand-primary">₹15</span>
                      </div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Single generation credit</p>
                    </button>

                    {/* Monthly Subscription */}
                    <button className="w-full p-6 rounded-3xl border-2 border-brand-primary bg-emerald-50 text-left relative overflow-hidden group">
                      <div className="absolute top-0 right-0 bg-brand-primary text-white text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">Popular</div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-black text-zinc-900">Pro Monthly</span>
                        <span className="text-xl font-display font-black text-brand-primary">₹199</span>
                      </div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Unlimited for 30 days</p>
                    </button>

                    {/* Yearly Subscription */}
                    <button className="w-full p-6 rounded-3xl border-2 border-zinc-50 hover:border-brand-primary transition-all text-left group">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-black text-zinc-900">Pro Yearly</span>
                        <div className="text-right">
                          <span className="text-xl font-display font-black text-brand-primary">₹1,499</span>
                          <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Save 40%</p>
                        </div>
                      </div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Best value for long term</p>
                    </button>
                  </div>

                  <button 
                    onClick={() => alert('Razorpay integration coming soon!')}
                    className="btn-primary w-full py-5 text-lg shadow-xl shadow-brand-primary/20"
                  >
                    Upgrade Now
                  </button>
                  
                  <button 
                    onClick={() => setShowUpgradeModal(false)}
                    className="w-full text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-zinc-900 transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <Footer />
    </div>
  );
}
