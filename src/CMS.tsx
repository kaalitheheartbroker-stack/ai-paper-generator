export const AdminPages = ({ pages }: any) => {
  const [editingPage, setEditingPage] = useState<any>(null);
  const [formData, setFormData] = useState({ title: '', content: '' });

  const handleSave = async () => {
    if (!editingPage) return;

    try {
      await setDoc(
        doc(db, 'pages', editingPage.id),
        {
          ...formData,
          lastUpdated: serverTimestamp()
        },
        { merge: true } // 🔥 IMPORTANT FIX
      );

      alert("Page saved successfully ✅");
      setEditingPage(null);
    } catch (error) {
      console.error("Save Error:", error);
      alert("Error saving page ❌");
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-black">Manage Dynamic Pages</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {['about', 'contact', 'privacy-policy', 'terms'].map(slug => {
          const page =
            pages.find((p: any) => p.id === slug) || {
              id: slug,
              title: slug.toUpperCase(),
              content: ''
            };

          return (
            <div key={slug} className="premium-card p-8 flex items-center justify-between group">
              <div className="space-y-1">
                <h4 className="font-bold text-zinc-900 capitalize">
                  {slug.replace('-', ' ')}
                </h4>
                <p className="text-[10px] text-zinc-400 uppercase tracking-widest">
                  Route: /{slug}
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingPage(page);
                  setFormData({
                    title: page.title,
                    content: page.content
                  });
                }}
                className="p-3 text-zinc-400 hover:text-brand-primary hover:bg-emerald-50 rounded-xl transition-all"
              >
                <Edit size={20} />
              </button>
            </div>
          );
        })}
      </div>

      {editingPage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl p-12 space-y-8 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black capitalize">
                Edit {editingPage.id.replace('-', ' ')} Page
              </h3>
              <button onClick={() => setEditingPage(null)}>
                <X />
              </button>
            </div>

            <div className="space-y-6">
              <input
                type="text"
                value={formData.title}
                onChange={e =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-6 py-4 bg-zinc-50 border rounded-2xl"
              />

              <textarea
                rows={15}
                value={formData.content}
                onChange={e =>
                  setFormData({ ...formData, content: e.target.value })
                }
                className="w-full px-8 py-8 bg-zinc-50 border rounded-2xl"
              />

              <div className="flex justify-end gap-4">
                <button onClick={() => setEditingPage(null)}>
                  Cancel
                </button>

                <button onClick={handleSave} className="btn-primary">
                  Save Changes
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
