import './BookmarksPage.css';

const API_URL = `${API_BASE_URL}/bookmarks`;
const initialBookmarkState = { title: '', link: '', category: '' };

function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState([]);
  const [newBookmark, setNewBookmark] = useState({ title: '', link: '', category: '' });
  const [editingId, setEditingId] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  useEffect(() =&gt; {
    fetchBookmarks();
  }, []);
  const fetchBookmarks = async () =&gt; {
    try {
      const res = await axios.get(API_URL);
      setIsLoading(true);
      setBookmarks(res.data);
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOrUpdate = async () =&gt; {
    if (!newBookmark.title || !newBookmark.link) return; // Basic validation
    setIsLoading(true);
    try {
      if (editingId) {
        const res = await axios.put(`${API_URL}/${editingId}`, newBookmark);
        setBookmarks(bookmarks.map(b =&gt; (b._id === editingId ? res.data : b)));
      } else {
          const res = await axios.post(API_URL, newBookmark);
        setBookmarks([res.data, ...bookmarks]);
      }
      handleClear();
    } catch (err) {
      console.error('Failed to save bookmark:', err);
    }
    try {
      await axios.delete(`${API_URL}/${id}`);
      setBookmarks(bookmarks.filter(b =&gt; b._id !== id));
      setIsLoading(true);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleClear = () =&gt; {
    setNewBookmark(initialBookmarkState);
    setEditingId(null);
  };

  const filtered = bookmarks.filter(
    (bm) =&gt;
      bm &amp;&amp; bm.title &amp;&amp; bm.category &amp;&amp; (
      bm.title.toLowerCase().includes(search.toLowerCase()) ||
      bm.category.toLowerCase().includes(search.toLowerCase())
      )
  );

  return (
      &lt;h1 className="bookmark-title"&gt;🔖 Bookmarks&lt;/h1&gt;
      &lt;input
        type="text"
        aria-label="Search bookmarks"
        placeholder="🔍 Search by title or category"
        className="bookmark-search input-dark"
        value={search}
      /&gt;
      &lt;div className="bookmark-input"&gt;
        &lt;input
          aria-label="Bookmark Title"
          type="text"
          placeholder="📌 Title"
          className="input-dark"
          value={newBookmark.title}
          onChange={(e) =&gt; setNewBookmark({ ...newBookmark, title: e.target.value })}
          required
        /&gt;
        &lt;input
          type="text"
          value={newBookmark.category}
          onChange={(e) =&gt; setNewBookmark({ ...newBookmark, category: e.target.value })}
        /&gt;
        &lt;button
          className="neon-add"
          onClick={handleAddOrUpdate}
          aria-label={editingId ? "Update bookmark" : "Add bookmark"}
          disabled={isLoading}
        &gt;
          {editingId ? '✎ Update' : '＋ Add'}
        &lt;/button&gt;
        {editingId && (
          &lt;button className="neon-delete" onClick={handleClear} aria-label="Cancel editing"&gt;
            Cancel
          &lt;/button&gt;
        )}
      &lt;/div&gt;
      &lt;div className="bookmark-list" role="list"&gt;
          &lt;p className="empty-message"&gt;No bookmarks found.&lt;/p&gt;
        ) : (
          filtered.map((bm) =&gt; (
            &lt;div key={bm._id} className="bookmark-item glow-hover" role="listitem"&gt;
            &lt;div className="bookmark-header"&gt;
              &lt;div className="bookmark-content"&gt;
                &lt;a href={bm.link} target="_blank" rel="noopener noreferrer"&gt;
                  {bm.title}
                &lt;/a&gt;
                {bm.category &amp;&amp; &lt;span className="bookmark-tag"&gt;#{bm.category}&lt;/span&gt;}
              &lt;/div&gt;
              &lt;div className="bookmark-actions"&gt;
                &lt;button
                  className="bookmark-edit"
                  onClick={() =&gt; handleEdit(bm)}
                  aria-label={`Edit bookmark: ${bm.title}`}
                &gt;
                  ✎
                &lt;/button&gt;
                &lt;button className="bookmark-delete" onClick={() =&gt; handleDelete(bm._id)} aria-label={`Delete bookmark: ${bm.title}`}&gt;✕&lt;/button&gt;
              &lt;/div&gt;
            &lt;/div&gt;
            &lt;/div&gt;
          ))
        )}
}

export default BookmarksPage;


