'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addOrUpdateBlog, deleteBlog } from '@/app/actions';

export default function BlogManager({ initialBlogs = [] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editBlog, setEditBlog] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [imageFile, setImageFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 5000);
  };

  const handleOpenCreate = () => {
    setEditBlog(null);
    setTitle('');
    setShortDesc('');
    setContent('');
    setIsPublished(true);
    setImageFile(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (b) => {
    setEditBlog(b);
    setTitle(b.title);
    setShortDesc(b.short_desc || '');
    setContent(b.content || '');
    setIsPublished(b.is_published === 1);
    setImageFile(null);
    setFormOpen(true);
  };

  const handleDelete = async (id, blogTitle) => {
    if (!confirm(`Are you sure you want to delete blog article "${blogTitle}"?`)) return;
    const res = await deleteBlog(id);
    if (res.success) {
      showAlert('success', `Blog deleted successfully.`);
      startTransition(() => {
        router.refresh();
      });
    } else {
      showAlert('danger', res.message);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content) return;
    setLoading(true);

    const formData = new FormData();
    if (editBlog) formData.append('id', editBlog.id);
    formData.append('title', title);
    formData.append('short_desc', shortDesc);
    formData.append('content', content);
    formData.append('is_published', isPublished ? '1' : '0');

    if (imageFile) {
      formData.append('featured_image', imageFile);
    } else if (editBlog) {
      formData.append('existing_image', editBlog.featured_image);
    }

    const res = await addOrUpdateBlog(formData);
    setLoading(false);

    if (res.success) {
      setFormOpen(false);
      showAlert('success', `Blog article "${title}" successfully ${editBlog ? 'updated' : 'created'}!`);
      startTransition(() => {
        router.refresh();
      });
    } else {
      showAlert('danger', res.message);
    }
  };

  return (
    <div>
      {/* Alert Banner */}
      {alert.message && (
        <div style={{
          padding: '12px 20px',
          borderRadius: '4px',
          background: alert.type === 'success' ? 'rgba(46, 125, 50, 0.1)' : 'rgba(198, 40, 40, 0.1)',
          border: `1px solid ${alert.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
          color: alert.type === 'success' ? 'var(--success)' : 'var(--danger)',
          marginBottom: '20px',
          fontSize: '0.85rem'
        }}>
          {alert.message}
        </div>
      )}

      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', margin: 0 }}>Artisan Blogs</h1>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Write Vastu tips, sculpt histories, and promote listings</span>
        </div>
        <button onClick={handleOpenCreate} className="btn-gold" style={{ fontSize: '0.8rem', padding: '10px 16px' }}>
          <i className="fas fa-plus" style={{ marginRight: '6px' }}></i> Create Article
        </button>
      </div>

      {/* Listing Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {initialBlogs.map((blog) => (
          <div key={blog.id} style={{
            background: 'white',
            borderRadius: '8px',
            border: '1px solid var(--primary-gold-border)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <img src={blog.featured_image || '/uploads/blog-placeholder.jpg'} alt="" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
              <div style={{ padding: '20px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', marginBottom: '6px' }}>{blog.title}</h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  {new Date(blog.publish_date || blog.created_at).toLocaleDateString('en-IN')}
                </span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5', height: '60px', overflow: 'hidden' }}>{blog.short_desc}</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', borderTop: '1px solid var(--bg-cream-dark)' }}>
              <button onClick={() => handleOpenEdit(blog)} style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', borderRight: '1px solid var(--bg-cream-dark)', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--info)' }}>
                <i className="fas fa-edit" style={{ marginRight: '6px' }}></i> Edit
              </button>
              <button onClick={() => handleDelete(blog.id, blog.title)} style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--danger)' }}>
                <i className="far fa-trash-alt" style={{ marginRight: '6px' }}></i> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {formOpen && (
        <div className="admin-modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="admin-modal-content" style={{ maxWidth: '650px', width: '90%', padding: '24px', maxHeight: '85vh', overflowY: 'auto' }}>
            <span className="modal-close-btn" onClick={() => setFormOpen(false)}>&times;</span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '16px' }}>
              {editBlog ? 'Edit Blog Article' : 'Write New Blog Article'}
            </h3>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Article Title *</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Vastu Guidelines for placing Ganesha idols" style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Short Summary (meta description) *</label>
                <input type="text" required value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} placeholder="e.g. Complete guide to Vastu directions for Ganesha statues in home mandirs." style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px' }}>Featured Cover Photo</label>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} style={{ fontSize: '0.8rem' }} />
                {editBlog && !imageFile && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Using existing featured cover</span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Article Content Body (supports HTML blocks) *</label>
                <textarea rows="10" required value={content} onChange={(e) => setContent(e.target.value)} placeholder="<p>Write your detailed blog text here...</p>" style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.8rem' }}></textarea>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="pub-chk" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} style={{ accentColor: 'var(--primary-gold)' }} />
                <label htmlFor="pub-chk" style={{ fontSize: '0.85rem', cursor: 'pointer' }}><strong>Publish article</strong> (Make visible on client blog lists)</label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--primary-gold-border)', paddingTop: '16px' }}>
                <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--text-muted)' }}>Cancel</button>
                <button type="submit" className="btn-gold" style={{ padding: '8px 16px', fontSize: '0.8rem' }} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
