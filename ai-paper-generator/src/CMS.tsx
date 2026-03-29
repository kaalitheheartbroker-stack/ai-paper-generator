import React, { useState, useEffect } from 'react';
/* eslint-disable jsx-a11y/control-has-associated-label */
import { motion } from 'motion/react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Save, 
  X, 
  Image as ImageIcon,
  Layout,
  FileText,
  MessageSquare,
  Zap,
  ArrowLeft,
  Search,
  ExternalLink
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  getDocs,
  setDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { Link, useParams } from 'react-router-dom';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from './firebase';

// --- HELPERS ---
const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// --- COMPONENTS ---

export const AdminDashboard = ({ blogs, pages, adSettings, setActiveTab }: any) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-display font-black text-zinc-900 dark:text-white">Admin Control Center</h2>
        <div className="flex items-center gap-3">
          <span className="px-4 py-2 bg-brand-primary/10 text-brand-primary rounded-xl text-xs font-bold uppercase tracking-widest">
            System Live
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="premium-card p-8 space-y-4 border-b-4 border-b-brand-primary">
          <div className="w-12 h-12 bg-emerald-50 text-brand-primary rounded-2xl flex items-center justify-center">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Total Blogs</p>
            <p className="text-3xl font-black text-zinc-900 dark:text-white">{blogs.length}</p>
          </div>
        </div>
        <div className="premium-card p-8 space-y-4 border-b-4 border-b-blue-500">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
            <MessageSquare size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Active Pages</p>
            <p className="text-3xl font-black text-zinc-900 dark:text-white">{pages.length}</p>
          </div>
        </div>
        <div className="premium-card p-8 space-y-4 border-b-4 border-b-amber-500">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Ad Placements</p>
            <p className="text-3xl font-black text-zinc-900 dark:text-white">4 Active</p>
          </div>
        </div>
        <div className="premium-card p-8 space-y-4 border-b-4 border-b-purple-500">
          <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center">
            <Layout size={24} />
          </div>
          <div>
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">CMS Status</p>
            <p className="text-xl font-black text-zinc-900 dark:text-white">Operational</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="premium-card p-8 space-y-6">
          <h3 className="text-xl font-display font-black">Quick Tools</h3>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setActiveTab('admin-blogs')} className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-3xl hover:bg-brand-primary/10 transition-all text-left space-y-2 group">
              <Plus size={20} className="text-brand-primary group-hover:scale-110 transition-transform" />
              <p className="text-sm font-bold">New Blog Post</p>
            </button>
            <button onClick={() => setActiveTab('admin-pages')} className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-3xl hover:bg-brand-primary/10 transition-all text-left space-y-2 group">
              <Plus size={20} className="text-blue-500 group-hover:scale-110 transition-transform" />
              <p className="text-sm font-bold">Edit Pages</p>
            </button>
          </div>
        </div>
        <div className="premium-card p-8 space-y-6">
          <h3 className="text-xl font-display font-black">Recent Activity</h3>
          <div className="space-y-4">
            {blogs.slice(0, 3).map((blog: any) => (
              <div key={blog.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center text-xs font-bold text-zinc-400">
                    B
                  </div>
                  <div>
                    <h4 className="text-sm font-bold truncate max-w-[150px]">{blog.title}</h4>
                    <p className="text-[10px] text-zinc-400">{blog.date}</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Published</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdminBlogs = ({ blogs }: any) => {
  const [editingBlog, setEditingBlog] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'GK',
    content: '',
    imageUrl: '',
    status: 'published'
  });

  const handleEdit = (blog: any) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title || '',
      category: blog.category || 'GK',
      content: blog.content || '',
      imageUrl: blog.imageUrl || '',
      status: blog.status || 'published'
    });
  };

 const handleDelete = async (id: string) => {
  if (!confirm('Are you sure you want to delete this post?')) return;
  try {
    await deleteDoc(doc(db, 'blogs', id));
    alert('Post deleted!');
  } catch (error) {
    console.error("Delete Error:", error);
    alert("Error deleting post ❌");
  }
};

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    try {
      const storage = getStorage();
      const storageRef = ref(storage, `blogs/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } catch (err) {
      console.error('Upload failed:', err);
    }
    setIsLoading(false);
  };

  const handleSave = async (e: any) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const slug = generateSlug(formData.title);

    const blogData = {
      ...formData,
      slug,
      date: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      updatedAt: serverTimestamp()
    };

    if (editingBlog.isNew) {
      await addDoc(collection(db, 'blogs'), {
        ...blogData,
        createdAt: serverTimestamp()
      });
      alert('Post published!');
    } else {
      await updateDoc(doc(db, 'blogs', editingBlog.id), blogData);
      alert('Post updated!');
    }

    setEditingBlog(null);
    setFormData({
      title: '',
      category: 'GK',
      content: '',
      imageUrl: '',
      status: 'published'
    });

  } catch (error) {
    console.error("Save Error:", error);
    alert("Error saving post ❌");
  }

  setIsLoading(false);
};

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black">Manage Blog Posts</h2>
        <button 
          onClick={() => setEditingBlog({ isNew: true })} 
          className="btn-primary flex items-center gap-2"
          aria-label="Create new blog post"
        >
          <Plus size={20} /> New Post
        </button>
      </div>

      {editingBlog && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="premium-card p-10 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">{editingBlog.isNew ? 'Create New Post' : 'Edit Post'}</h3>
            <button 
              onClick={() => setEditingBlog(null)} 
              className="p-2 hover:bg-zinc-100 rounded-full"
              aria-label="Close editor"
            >
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Blog Title</label>
                  <input 
                    type="text" 
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-primary/10"
                    placeholder="Enter catchy title..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="blog-category" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Category</label>
                  <select 
                    id="blog-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 rounded-2xl focus:outline-none"
                  >
                    <option value="GK">General Knowledge</option>
                    <option value="Math">Mathematics</option>
                    <option value="Reasoning">Reasoning</option>
                    <option value="Jobs">Job Alerts</option>
                  </select>
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Featured Image (URL or Upload)</label>
                  <div className="flex flex-col gap-2">
                    <input 
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="Paste Image URL here (Free approach)"
                      className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/10 text-sm"
                    />
                    <div className="flex items-center gap-4">
                      <input 
                        type="file" 
                        onChange={handleImageUpload}
                        className="hidden" 
                        id="img-upload" 
                        accept="image/*"
                      />
                      <label 
                        htmlFor="img-upload" 
                        className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-2 border-dashed border-zinc-200 rounded-xl flex items-center justify-center gap-3 cursor-pointer hover:bg-zinc-100 transition-all text-sm"
                      >
                        <ImageIcon size={16} className="text-zinc-400" />
                        <span className="font-bold text-zinc-600">
                          {formData.imageUrl ? 'Update Uploaded Image' : 'or Click to Upload File'}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</label>
                  <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, status: 'published' })}
                      className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${formData.status === 'published' ? 'bg-brand-primary text-white' : 'bg-zinc-100 text-zinc-400'}`}
                      aria-label="Set status to published"
                    >
                      Published
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFormData({ ...formData, status: 'draft' })}
                      className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${formData.status === 'draft' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'}`}
                      aria-label="Set status to draft"
                    >
                      Draft
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Blog Content (supports HTML)</label>
              <textarea 
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full h-96 px-8 py-8 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-brand-primary/10 font-mono text-sm leading-relaxed"
                placeholder="Write your story here... Use <h2>, <p>, <ul> tags for formatting."
                required
              />
            </div>
            <div className="flex justify-end gap-4">
              <button 
                type="button"
                onClick={() => setEditingBlog(null)}
                className="px-8 py-4 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isLoading}
                className="btn-primary flex items-center gap-2 min-w-[150px] justify-center"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : editingBlog.isNew ? <><Plus size={20}/> Publish Now</> : <><Save size={20}/> Update Post</>}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {blogs.map((blog: any) => (
          <div key={blog.id} className="premium-card p-6 flex items-center justify-between group hover:border-brand-primary transition-all">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 overflow-hidden shrink-0">
                {blog.imageUrl ? <img src={blog.imageUrl} alt={blog.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-300"><ImageIcon size={24} aria-label="No image"/></div>}
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 leading-snug mb-1">{blog.title}</h4>
                <div className="flex items-center gap-3 text-xs text-zinc-400 font-medium">
                  <span className="uppercase tracking-widest font-black text-brand-primary">{blog.category}</span>
                  <span>•</span>
                  <span>{blog.date}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleEdit(blog)} 
                className="p-3 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                aria-label={`Edit ${blog.title}`}
              >
                <Edit size={18}/>
              </button>
              <button 
                onClick={() => handleDelete(blog.id)} 
                className="p-3 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                aria-label={`Delete ${blog.title}`}
              >
                <Trash2 size={18}/>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AdminPages = ({ pages }: any) => {
  const [editingPage, setEditingPage] = useState<any>(null);
  const [formData, setFormData] = useState({ title: '', content: '' });

  const handleSave = async () => {
    if (!editingPage) return;
    await updateDoc(doc(db, 'pages', editingPage.id), {
      ...formData,
      lastUpdated: serverTimestamp()
    });
    setEditingPage(null);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-black">Manage Dynamic Pages</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {['about', 'contact', 'privacy-policy', 'terms'].map(slug => {
          const page = pages.find((p: any) => p.id === slug) || { id: slug, title: slug.toUpperCase(), content: '' };
          return (
            <div key={slug} className="premium-card p-8 flex items-center justify-between group">
              <div className="space-y-1">
                <h4 className="font-bold text-zinc-900 capitalize">{slug.replace('-', ' ')}</h4>
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Route: /{slug}</p>
              </div>
              <button 
                onClick={() => { setEditingPage(page); setFormData({ title: page.title, content: page.content }); }}
                className="p-3 text-zinc-400 hover:text-brand-primary hover:bg-emerald-50 rounded-xl transition-all"
                title={`Edit ${slug} page`}
              >
                <Edit size={20} />
              </button>
            </div>
          );
        })}
      </div>

      {editingPage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-900/60 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] w-full max-w-4xl p-12 space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
             <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black capitalize">Edit {editingPage.id.replace('-', ' ')} Page</h3>
                <button onClick={() => setEditingPage(null)} aria-label="Close modal"><X /></button>
             </div>
             <div className="space-y-6">
               <div className="space-y-2">
                 <label htmlFor="page-title" className="text-xs font-black text-zinc-400 uppercase tracking-widest">Page Title</label>
                 <input 
                   id="page-title"
                   type="text" 
                   value={formData.title}
                   onChange={e => setFormData({ ...formData, title: e.target.value })}
                   className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none"
                 />
               </div>
               <div className="space-y-2">
                 <label htmlFor="page-content" className="text-xs font-black text-zinc-400 uppercase tracking-widest">HTML Content</label>
                 <textarea 
                   id="page-content"
                   rows={15}
                   value={formData.content}
                   onChange={e => setFormData({ ...formData, content: e.target.value })}
                   className="w-full px-8 py-8 bg-zinc-50 border border-zinc-100 rounded-[2rem] focus:outline-none font-mono text-sm"
                 />
               </div>
               <div className="flex justify-end gap-4">
                 <button onClick={() => setEditingPage(null)} className="px-6 font-bold text-zinc-400" aria-label="Cancel page edit" title="Cancel">Cancel</button>
                 <button onClick={handleSave} className="btn-primary" aria-label="Save page changes" title="Save Changes">Save Changes</button>
               </div>
             </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export const AdminAds = ({ adSettings }: any) => {
  const [formData, setFormData] = useState({
    header: adSettings.header || '',
    footer: adSettings.footer || '',
    sidebar: adSettings.sidebar || '',
    inContent: adSettings.inContent || ''
  });

  const handleSave = async (e: any) => {
    e.preventDefault();
    await setDoc(doc(db, 'settings', 'ads'), formData);
    alert('Ad settings updated!');
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-black">AdSense Management</h2>
      <div className="premium-card p-10 bg-zinc-900 text-white space-y-8">
        <form onSubmit={handleSave} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label htmlFor="ad-header" className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Header Ad Code</label>
              <textarea 
                id="ad-header"
                rows={5}
                value={formData.header}
                onChange={e => setFormData({ ...formData, header: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 font-mono text-xs text-white/60 focus:outline-none focus:border-brand-primary transition-all"
                placeholder="Paste AdSense script here..."
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="ad-footer" className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Footer Ad Code</label>
              <textarea 
                id="ad-footer"
                rows={5}
                value={formData.footer}
                onChange={e => setFormData({ ...formData, footer: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 font-mono text-xs text-white/60 focus:outline-none focus:border-brand-primary transition-all"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="ad-sidebar" className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Sidebar Ad Code</label>
              <textarea 
                id="ad-sidebar"
                rows={5}
                value={formData.sidebar}
                onChange={e => setFormData({ ...formData, sidebar: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 font-mono text-xs text-white/60 focus:outline-none focus:border-brand-primary transition-all"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="ad-content" className="text-[10px] font-black text-brand-primary uppercase tracking-widest">In-Content Ad Code</label>
              <textarea 
                id="ad-content"
                rows={5}
                value={formData.inContent}
                onChange={e => setFormData({ ...formData, inContent: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 font-mono text-xs text-white/60 focus:outline-none focus:border-brand-primary transition-all"
                placeholder="Paste AdSense script here..."
              />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full py-5 text-lg" aria-label="Save all ad slots" title="Save All Ad Slots">Save All Ad Slots</button>
        </form>
      </div>
    </div>
  );
};

export const AdminCategories = () => {
  const [categories, setCategories] = useState<{id: string, label: string}[]>([]);
  const [newCategory, setNewCategory] = useState({ id: '', label: '' });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'categories'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().items) {
        setCategories(docSnap.data().items);
      } else {
        setCategories([
          { id: 'all', label: 'All Exams' },
          { id: 'upsc', label: 'UPSC' },
          { id: 'ssc', label: 'SSC' },
        ]);
      }
    });
    return () => unsub();
  }, []);

  const handleSave = async (items: any[]) => {
    await setDoc(doc(db, 'settings', 'categories'), { items });
  };

  const handleAdd = async (e: any) => {
    e.preventDefault();
    if (!newCategory.id || !newCategory.label) return;
    const updated = [...categories, newCategory];
    setCategories(updated);
    setNewCategory({ id: '', label: '' });
    await handleSave(updated);
  };

  const handleDelete = async (index: number) => {
    const updated = categories.filter((_, i) => i !== index);
    setCategories(updated);
    await handleSave(updated);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-black">Manage Categories</h2>
      <div className="premium-card p-10 space-y-8">
        <form onSubmit={handleAdd} className="flex gap-4">
          <input 
            type="text" 
            placeholder="Category ID (e.g. upsc)" 
            value={newCategory.id}
            onChange={e => setNewCategory({...newCategory, id: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')})}
            className="flex-1 px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none"
            required
          />
          <input 
            type="text" 
            placeholder="Display Label (e.g. UPSC Civil Services)" 
            value={newCategory.label}
            onChange={e => setNewCategory({...newCategory, label: e.target.value})}
            className="flex-2 px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:outline-none"
            required
          />
          <button type="submit" className="btn-primary flex items-center gap-2"><Plus size={20}/> Add Category</button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((cat, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <div>
                <p className="font-bold text-zinc-900">{cat.label}</p>
                <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">{cat.id}</p>
              </div>
              <button 
                onClick={() => handleDelete(index)}
                className="p-3 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                title={`Delete ${cat.label}`}
              >
                <Trash2 size={18}/>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- FRONTEND COMPONENTS ---

export const BlogList = ({ blogs }: any) => {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-display font-black text-zinc-900 dark:text-white">Exam News & Jobs</h1>
        <p className="text-zinc-500 max-w-2xl mx-auto">Latest updates on government exams, preparation tips, and career opportunities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {blogs.map((blog: any) => (
          <motion.div 
            key={blog.id} 
            whileHover={{ y: -10 }}
            className="premium-card overflow-hidden group flex flex-col"
          >
            <div className="h-56 bg-zinc-100 overflow-hidden relative">
              {blog.imageUrl ? <img src={blog.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={blog.title} /> : <div className="w-full h-full flex items-center justify-center text-zinc-300"><ImageIcon size={48} title="No featured image"/></div>}
              <div className="absolute top-4 left-4 px-4 py-2 bg-white/90 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-primary">
                {blog.category}
              </div>
            </div>
            <div className="p-8 space-y-4 flex-1 flex flex-col">
              <div className="flex items-center gap-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                <span>{blog.date}</span>
                <span>•</span>
                <span>5 Min Read</span>
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white leading-snug group-hover:text-brand-primary transition-colors">
                <Link to={`/blog/${blog.slug}`}>{blog.title}</Link>
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed flex-1">
                {blog.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
              </p>
              <Link to={`/blog/${blog.slug}`} className="pt-4 flex items-center gap-2 text-brand-primary font-bold text-sm group-hover:gap-3 transition-all">
                Read Full Story <ChevronRight size={18} />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export const BlogDetail = ({ blogs, adSettings }: any) => {
  const { slug } = useParams();
  const blog = blogs.find((b: any) => b.slug === slug);

  if (!blog) return <div className="min-h-screen flex items-center justify-center">Loading Story...</div>;

  return (
    <article className="max-w-4xl mx-auto px-6 py-12 space-y-12">
       {/* Ad: Header */}
       {adSettings.header && <div className="w-full flex justify-center py-4" dangerouslySetInnerHTML={{ __html: adSettings.header }} />}

       <div className="space-y-6 text-center">
         <div className="flex items-center justify-center gap-4">
           <span className="px-4 py-2 bg-emerald-50 text-brand-primary rounded-xl text-xs font-black uppercase tracking-widest">{blog.category}</span>
           <span className="text-zinc-400 text-sm font-medium">{blog.date}</span>
         </div>
         <h1 className="text-5xl font-display font-black text-zinc-900 dark:text-white leading-tight">{blog.title}</h1>
       </div>

       {blog.imageUrl && (
         <div className="aspect-video rounded-[3rem] overflow-hidden shadow-2xl">
           <img src={blog.imageUrl} className="w-full h-full object-cover" alt={blog.title} />
         </div>
       )}

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
         <div className="lg:col-span-8 space-y-10">
            <div 
              className="prose prose-zinc prose-lg dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-300 leading-[2] font-medium"
              dangerouslySetInnerHTML={{ __html: blog.content.replace('</h2>', '</h2>' + (adSettings.inContent || '')) }}
            />
         </div>

         <div className="lg:col-span-4 space-y-8">
            {/* Ad: Sidebar */}
            {adSettings.sidebar && (
              <div className="premium-card p-6 bg-zinc-50 dark:bg-zinc-800" dangerouslySetInnerHTML={{ __html: adSettings.sidebar }} />
            )}
            
            <div className="premium-card p-8 space-y-6 sticky top-32">
              <h3 className="text-lg font-bold">Latest Stories</h3>
              <div className="space-y-6">
                {blogs.slice(0, 4).filter((b:any) => b.id !== blog.id).map((b:any) => (
                  <Link key={b.id} to={`/blog/${b.slug}`} className="flex gap-4 group">
                    <div className="w-16 h-16 rounded-xl bg-zinc-100 overflow-hidden shrink-0">
                       <img src={b.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-all" alt={b.title} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-2 leading-snug group-hover:text-brand-primary transition-colors">{b.title}</h4>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
         </div>
       </div>

       {/* Ad: Footer */}
       {adSettings.footer && <div className="w-full flex justify-center py-4 border-t border-zinc-100" dangerouslySetInnerHTML={{ __html: adSettings.footer }} />}
    </article>
  );
};

export const PageLoader = ({ pages }: any) => {
  const { slug } = useParams();
  const page = pages.find((p: any) => p.id === slug);

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="premium-card p-12 md:p-20 space-y-12">
        <h1 className="text-5xl font-display font-black text-zinc-900 border-b-8 border-brand-primary inline-block pb-4">{page?.title || slug?.replace('-', ' ').toUpperCase()}</h1>
        <div 
          className="prose prose-zinc prose-xl max-w-none text-zinc-600 leading-[2.2] font-medium"
          dangerouslySetInnerHTML={{ __html: page?.content || '<p>Content coming soon...</p>' }}
        />
      </div>
    </div>
  );
};

export const PublicHome = ({ blogs, onStart }: any) => {
  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand-primary/5 blur-[120px] rounded-full -z-10" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-2xl text-brand-primary text-xs font-black uppercase tracking-widest border border-emerald-100">
              <Zap size={14} fill="currentColor" />
              AI-Powered Preparation
            </div>
            <h1 className="text-6xl md:text-7xl font-display font-black text-zinc-900 leading-[0.9] tracking-tighter">
              Master Your <br/>
              <span className="text-brand-primary">Exams</span> with AI
            </h1>
            <p className="text-xl text-zinc-500 font-medium leading-relaxed max-w-xl">
              Generate custom practice papers, get instant analysis, and track your progress. The most advanced tool for UPSC, SSC, and Banking aspirants.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={onStart}
                className="btn-primary px-10 py-5 text-lg shadow-2xl shadow-brand-primary/20 flex items-center gap-3"
              >
                Start Practice Now <ArrowRight size={20} />
              </button>
              <Link 
                to="/blog" 
                className="px-10 py-5 bg-white border border-zinc-100 rounded-3xl font-black uppercase tracking-widest text-sm hover:bg-zinc-50 transition-all flex items-center gap-3"
              >
                Read Exam News
              </Link>
            </div>
            <div className="flex items-center gap-8 pt-8 border-t border-zinc-100">
              <div>
                <p className="text-2xl font-black text-zinc-900">50k+</p>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Active Users</p>
              </div>
              <div className="w-px h-10 bg-zinc-100" />
              <div>
                <p className="text-2xl font-black text-zinc-900">1M+</p>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Questions Generated</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
             <div className="absolute inset-0 bg-brand-primary/20 blur-[100px] rounded-full" />
             <div className="relative premium-card p-4 rotate-3 hover:rotate-0 transition-transform duration-700">
                <img 
                  src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800" 
                  alt="Dashboard Preview" 
                  className="rounded-[2rem] shadow-2xl"
                />
             </div>
          </motion.div>
        </div>
      </section>

      {/* Latest Blog Preview */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-display font-black text-zinc-900">Latest Exam Updates</h2>
            <p className="text-zinc-500 font-medium max-w-xl">Stay ahead with real-time job alerts, notification updates, and preparation strategies.</p>
          </div>
          <Link to="/blog" className="flex items-center gap-2 text-brand-primary font-black uppercase tracking-widest text-xs hover:gap-4 transition-all">
            View All Stories <ArrowRight size={16} />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {blogs.slice(0, 3).map((blog: any) => (
            <Link key={blog.id} to={`/blog/${blog.slug}`} className="group space-y-4">
              <div className="aspect-[16/9] rounded-[2rem] overflow-hidden bg-zinc-100">
                <img 
                  src={blog.imageUrl || `https://picsum.photos/seed/${blog.id}/600/400`} 
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">{blog.category}</span>
                <h3 className="text-xl font-bold text-zinc-900 group-hover:text-brand-primary transition-colors line-clamp-2 leading-tight">
                  {blog.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Feature Grid */}
      <section className="bg-zinc-900 rounded-[4rem] py-24 mx-6">
        <div className="max-w-7xl mx-auto px-12">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-6">
                <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
                  <Zap size={28} />
                </div>
                <h3 className="text-2xl font-display font-black text-white">Instant Generation</h3>
                <p className="text-zinc-400 font-medium leading-relaxed">No more waiting. Generate 50+ high-quality questions in under 2 seconds using our proprietary hybrid engine.</p>
              </div>
              <div className="space-y-6">
                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                  <Layout size={28} />
                </div>
                <h3 className="text-2xl font-display font-black text-white">Topic Analysis</h3>
                <h3 className="sr-only">Detailed Insights</h3>
                <p className="text-zinc-400 font-medium leading-relaxed">Get deep insights into your strengths and weaknesses with our automated performance breakdown.</p>
              </div>
              <div className="space-y-6">
                <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500">
                  <FileText size={28} />
                </div>
                <h3 className="text-2xl font-display font-black text-white">PDF Friendly</h3>
                <p className="text-zinc-400 font-medium leading-relaxed">Download your papers in professional PDF formats, ready for printing or offline practice.</p>
              </div>
           </div>
        </div>
      </section>
    </div>
  );
};

// Re-using common icons since they aren't imported here
const ChevronRight = ({ size, className }: any) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
const ChevronLeft = ({ size, className }: any) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
const Timer = ({ size, className }: any) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
const ArrowRight = ({ size, className }: any) => <svg width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>;
