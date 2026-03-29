import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../firebase';
import {
  collection, onSnapshot, query, orderBy, deleteDoc, doc, getDocs, getDoc, setDoc, updateDoc, addDoc
} from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  Users, FileText, Trash2, RefreshCw, Settings, Shield, BarChart2,
  LogOut, ToggleLeft, ToggleRight, Lock, Mail, AlertCircle, ChevronDown, X, Eye,
  BookOpen, Plus, Star, Link as LinkIcon
} from 'lucide-react';

const ADMIN_EMAIL = 'rstenguriya16@gmail.com';

interface Paper {
  id: string;
  name: string;
  uid: string;
  type: string;
  questions: number;
  date: string;
  category: string;
  status: string;
}

interface Book {
  id: string;
  title: string;
  category: string;
  questions: number;
  image: string;
  rating: number;
  fileURL: string;
}

interface AdminSettings {
  aiEnabled: boolean;
  generationLimit: number;
  maintenanceMode: boolean;
}

const DEFAULT_SETTINGS: AdminSettings = { aiEnabled: true, generationLimit: 10, maintenanceMode: false };

// ─── Login Screen ───────────────────────────────────────
const AdminLogin: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      if (cred.user.email !== ADMIN_EMAIL) {
        await signOut(auth);
        setError('Access denied. Admin credentials only.');
        return;
      }
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 to-zinc-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-10 shadow-2xl"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-brand-primary/10 border border-brand-primary/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-brand-primary" />
          </div>
          <h1 className="text-2xl font-black text-white">Admin Access</h1>
          <p className="text-zinc-500 text-sm mt-2">PreExamWale Control Panel</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm mb-6">
            <AlertCircle size={18} />{error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-2">
              <Mail size={12} /> Email
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-brand-primary rounded-xl px-4 py-3 outline-none text-white font-medium transition-colors"
              placeholder="admin@preexamwale.in"
            />
          </div>
          <div>
            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-2">
              <Lock size={12} /> Password
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full bg-zinc-800 border border-zinc-700 focus:border-brand-primary rounded-xl px-4 py-3 outline-none text-white font-medium transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full py-4 mt-2 bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-widest transition-all"
          >
            {loading ? 'Authenticating...' : 'Sign In as Admin'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// ─── Stats Card ─────────────────────────────────────────
const StatCard: React.FC<{ icon: any; label: string; value: string | number; color: string }> = ({ icon: Icon, label, value, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4"
  >
    <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
      <Icon size={22} />
    </div>
    <div>
      <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">{label}</p>
      <p className="text-3xl font-black text-white mt-1">{value}</p>
    </div>
  </motion.div>
);

// ─── Main Admin Panel ────────────────────────────────────
const AdminPanel: React.FC = () => {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'papers' | 'users' | 'books' | 'settings'>('dashboard');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showAddBook, setShowAddBook] = useState(false);
  const [newBook, setNewBook] = useState<Partial<Book>>({
    title: '', category: 'upsc', questions: 100, image: '', rating: 4.5, fileURL: ''
  });

  // Listen to auth state
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged(u => {
      if (u?.email === ADMIN_EMAIL) {
        setAdminUser(u);
      } else {
        setAdminUser(null);
      }
      setLoading(false);
    });
    return () => unsubAuth();
  }, []);

  // Fetch papers
  useEffect(() => {
    if (!adminUser) return;
    const q = query(collection(db, 'papers'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setPapers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Paper)));
    });
    return () => unsub();
  }, [adminUser]);

  // Fetch users
  useEffect(() => {
    if (!adminUser) return;
    const unsub = onSnapshot(collection(db, 'users'), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [adminUser]);

  // Fetch books
  useEffect(() => {
    if (!adminUser) return;
    const unsub = onSnapshot(collection(db, 'books'), snap => {
      setBooks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Book)));
    });
    return () => unsub();
  }, [adminUser]);

  // Fetch settings from Firestore
  useEffect(() => {
    if (!adminUser) return;
    const unsub = onSnapshot(doc(db, 'settings', 'admin'), snap => {
      if (snap.exists()) setSettings({ ...DEFAULT_SETTINGS, ...snap.data() });
    });
    return () => unsub();
  }, [adminUser]);

  const handleDeletePaper = async (paperId: string) => {
    if (!confirm('Delete this paper permanently?')) return;
    setDeletingId(paperId);
    try {
      await deleteDoc(doc(db, 'papers', paperId));
    } catch (err) {
      alert('Failed to delete paper.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBook.title || !newBook.fileURL) return alert('Fill title and URL');
    setSavingSettings(true);
    try {
      await addDoc(collection(db, 'books'), newBook);
      setNewBook({ title: '', category: 'upsc', questions: 100, image: '', rating: 4.5, fileURL: '' });
      setShowAddBook(false);
      alert('Book added successfully!');
    } catch (err) {
      alert('Failed to add book.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDeleteBook = async (id: string) => {
    if (!confirm('Delete this book?')) return;
    try {
      await deleteDoc(doc(db, 'books', id));
    } catch (err) {
      alert('Failed to delete.');
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'admin'), settings);
      alert('Settings saved successfully!');
    } catch (err) {
      alert('Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setAdminUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!adminUser) {
    return <AdminLogin onLogin={() => {}} />;
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { id: 'papers', label: `Papers (${papers.length})`, icon: FileText },
    { id: 'users', label: `Users (${users.length})`, icon: Users },
    { id: 'books', label: `Books (${books.length})`, icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Topbar */}
      <div className="sticky top-0 z-50 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
            <Shield size={16} />
          </div>
          <span className="font-black text-white">PreExamWale Admin</span>
          <span className="px-3 py-1 bg-brand-primary/15 text-brand-primary rounded-full text-xs font-bold uppercase tracking-widest">Live</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400">{adminUser.email}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-red-500/10 hover:text-red-400 rounded-xl text-zinc-400 text-sm font-bold transition-all"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-600'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Dashboard ─────────────────────────────── */}
          {activeTab === 'dashboard' && (
            <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <StatCard icon={FileText} label="Total Papers" value={papers.length} color="bg-brand-primary/10 text-brand-primary" />
                <StatCard icon={Users} label="Total Users" value={users.length} color="bg-blue-500/10 text-blue-400" />
                <StatCard icon={ToggleRight} label="PreExamWale Status" value={settings.aiEnabled ? 'Active' : 'Disabled'} color="bg-emerald-500/10 text-emerald-400" />
                <StatCard icon={Settings} label="Gen Limit" value={settings.generationLimit} color="bg-amber-500/10 text-amber-400" />
              </div>

              {/* Recent Papers */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="font-black text-white mb-4">Recent Papers</h3>
                <div className="space-y-3">
                  {papers.slice(0, 5).map(paper => (
                    <div key={paper.id} className="flex items-center justify-between p-4 bg-zinc-800 rounded-xl">
                      <div>
                        <p className="font-bold text-white text-sm">{paper.name}</p>
                        <p className="text-xs text-zinc-400">{paper.type} • {paper.questions} questions • {new Date(paper.date).toLocaleDateString()}</p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold">
                        {paper.status}
                      </span>
                    </div>
                  ))}
                  {papers.length === 0 && <p className="text-zinc-500 text-sm text-center py-4">No papers generated yet.</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Papers Management ─────────────────────── */}
          {activeTab === 'papers' && (
            <motion.div key="papers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-white">All Generated Papers</h2>
                <span className="text-zinc-400 text-sm">{papers.length} total</span>
              </div>
              {papers.length === 0 && (
                <div className="text-center py-16 text-zinc-500">No papers found in database.</div>
              )}
              <div className="space-y-3">
                {papers.map(paper => (
                  <motion.div
                    key={paper.id}
                    layout
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white truncate">{paper.name}</p>
                      <div className="flex gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-zinc-500">{paper.type}</span>
                        <span className="text-xs text-zinc-500">•</span>
                        <span className="text-xs text-zinc-500">{paper.questions} questions</span>
                        <span className="text-xs text-zinc-500">•</span>
                        <span className="text-xs text-zinc-500">{paper.category}</span>
                        <span className="text-xs text-zinc-500">•</span>
                        <span className="text-xs text-zinc-500">{new Date(paper.date).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${paper.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {paper.status}
                      </span>
                      <button
                        onClick={() => handleDeletePaper(paper.id)}
                        disabled={deletingId === paper.id}
                        className="p-2 hover:bg-red-500/10 hover:text-red-400 text-zinc-500 rounded-xl transition-all disabled:opacity-50"
                        title="Delete Paper"
                      >
                        {deletingId === paper.id ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Users ─────────────────────────────────── */}
          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-white">Registered Users</h2>
                <span className="text-zinc-400 text-sm">{users.length} total</span>
              </div>
              {users.length === 0 && (
                <div className="text-center py-16 text-zinc-500">No registered users yet.</div>
              )}
              <div className="space-y-3">
                {users.map(user => (
                  <div key={user.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-primary/10 text-brand-primary rounded-xl flex items-center justify-center font-black text-sm">
                      {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white">{user.displayName || 'Unknown'}</p>
                      <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${user.role === 'admin' ? 'bg-brand-primary/10 text-brand-primary' : 'bg-zinc-800 text-zinc-400'}`}>
                      {user.role || 'student'}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Manage Books ──────────────────────────── */}
          {activeTab === 'books' && (
            <motion.div key="books" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-white">Practice Books Library</h2>
                <button 
                  onClick={() => setShowAddBook(!showAddBook)}
                  className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest"
                >
                  <Plus size={18} /> {showAddBook ? 'Cancel' : 'Add New Book'}
                </button>
              </div>

              {showAddBook && (
                <motion.form 
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  onSubmit={handleAddBook}
                  className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 grid md:grid-cols-2 gap-6"
                >
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 block">Book Title</label>
                      <input type="text" value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3" placeholder="e.g. UPSC Indian Polity" />
                    </div>
                    <div>
                      <label className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 block">Category</label>
                      <select title="Select Category" value={newBook.category} onChange={e => setNewBook({...newBook, category: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3">
                        <option value="upsc">UPSC</option>
                        <option value="ssc">SSC</option>
                        <option value="banking">Banking</option>
                        <option value="railway">Railway</option>
                        <option value="state">State Exams</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 block">Questions Count</label>
                      <input title="Questions Count" type="number" value={newBook.questions} onChange={e => setNewBook({...newBook, questions: parseInt(e.target.value)})} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 block">Image URL (Icon)</label>
                      <input type="text" value={newBook.image} onChange={e => setNewBook({...newBook, image: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3" placeholder="https://..." />
                    </div>
                    <div>
                      <label className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 block">PDF File URL (G-Drive / Firebase)</label>
                      <input type="text" value={newBook.fileURL} onChange={e => setNewBook({...newBook, fileURL: e.target.value})} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3" placeholder="https://..." />
                    </div>
                    <div className="pt-4">
                      <button disabled={savingSettings} type="submit" className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all">
                        {savingSettings ? 'Adding...' : 'Save Book to DB'}
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {books.map(book => (
                  <div key={book.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-16 bg-zinc-800 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                        {book.image ? <img src={book.image} alt="" className="w-full h-full object-cover" /> : <BookOpen size={24} className="text-zinc-600" />}
                      </div>
                      <div>
                        <p className="font-bold text-white">{book.title}</p>
                        <div className="flex gap-3 text-[10px] font-black text-zinc-500 uppercase">
                          <span>{book.category}</span>
                          <span>•</span>
                          <span>{book.questions} Qs</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <a title="View File" href={book.fileURL} target="_blank" rel="noreferrer" className="p-2 bg-zinc-800 hover:text-brand-primary rounded-xl transition-all">
                         <LinkIcon size={16} />
                       </a>
                       <button title="Delete Book" onClick={() => handleDeleteBook(book.id)} className="p-2 bg-zinc-800 hover:text-red-400 rounded-xl transition-all">
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Settings ──────────────────────────────── */}
          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
              <h2 className="text-xl font-black text-white">System Settings</h2>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
                {/* AI Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-white">PreExamWale Paper Generation</p>
                    <p className="text-zinc-500 text-sm">Enable or disable AI-powered generation for all users</p>
                  </div>
                  <button
                    onClick={() => setSettings(prev => ({ ...prev, aiEnabled: !prev.aiEnabled }))}
                    className={`p-2 rounded-xl transition-all ${settings.aiEnabled ? 'text-brand-primary' : 'text-zinc-600'}`}
                  >
                    {settings.aiEnabled ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
                  </button>
                </div>

                <div className="border-t border-zinc-800" />

                {/* Generation Limit */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-black text-white">Free Generation Limit</p>
                      <p className="text-zinc-500 text-sm">Max papers per user (hidden from users)</p>
                    </div>
                    <span className="text-2xl font-black text-brand-primary">{settings.generationLimit}</span>
                  </div>
                  <input
                    title="Generation Limit"
                    type="range" min="1" max="100" step="1"
                    value={settings.generationLimit}
                    onChange={e => setSettings(prev => ({ ...prev, generationLimit: Number(e.target.value) }))}
                    className="w-full accent-brand-primary"
                  />
                  <div className="flex justify-between text-xs text-zinc-500 mt-1">
                    <span>1</span><span>50</span><span>100</span>
                  </div>
                </div>

                <div className="border-t border-zinc-800" />

                {/* Maintenance Mode */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-white">Maintenance Mode</p>
                    <p className="text-zinc-500 text-sm">Block all user access while updating</p>
                  </div>
                  <button
                    title="Toggle Maintenance Mode"
                    onClick={() => setSettings(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                    className={`p-2 rounded-xl transition-all ${settings.maintenanceMode ? 'text-red-400' : 'text-zinc-600'}`}
                  >
                    {settings.maintenanceMode ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="w-full py-4 bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-widest transition-all"
              >
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminPanel;
