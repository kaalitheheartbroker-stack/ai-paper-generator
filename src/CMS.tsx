export const AdminPages = ({ pages }: any) => {
  const [editingPage, setEditingPage] = useState<any>(null);
  const [formData, setFormData] = useState({ title: '', content: '' });

  const handleSave = async () => {
    try {
      if (!editingPage) return;

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
          const page = pages.find((p: any) => p.id === slug) || {
            id: slug,
            title: slug.toUpperCase(),
            content: ''
          };

          return (
            <div key={slug} className="premium-card p-8 flex items-center justify-between">
              <div>
                <h4 className="font-bold">{slug.replace('-', ' ')}</h4>
                <p className="text-sm text-gray-400">/{slug}</p>
              </div>

              <button
                onClick={() => {
                  setEditingPage(page);
                  setFormData({
                    title: page.title,
                    content: page.content
                  });
                }}
                className="p-3 hover:bg-gray-100 rounded-xl"
              >
                Edit
              </button>
            </div>
          );
        })}
      </div>

      {editingPage && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 w-full max-w-xl rounded-xl">

            <h3 className="text-lg font-bold mb-4">
              Edit {editingPage.id}
            </h3>

            <input
              type="text"
              value={formData.title}
              onChange={e =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full p-3 border mb-4"
            />

            <textarea
              rows={10}
              value={formData.content}
              onChange={e =>
                setFormData({ ...formData, content: e.target.value })
              }
              className="w-full p-3 border mb-4"
            />

            <button
              onClick={handleSave}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Save
            </button>

          </div>
        </div>
      )}
    </div>
  );
};
