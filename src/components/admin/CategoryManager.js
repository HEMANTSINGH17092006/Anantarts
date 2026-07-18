'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addOrUpdateCategory, deleteCategory } from '@/app/actions';

export default function CategoryManager({ initialCategories = [] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isHidden, setIsHidden] = useState(false);
  const [imageFile, setImageFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 5000);
  };

  const handleOpenCreate = () => {
    setEditCategory(null);
    setName('');
    setSortOrder('0');
    setIsHidden(false);
    setImageFile(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditCategory(c);
    setName(c.name);
    setSortOrder(c.sort_order?.toString() || '0');
    setIsHidden(c.is_hidden === 1);
    setImageFile(null);
    setFormOpen(true);
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Are you sure you want to delete category "${title}"?`)) return;
    const res = await deleteCategory(id);
    if (res.success) {
      showAlert('success', `Category deleted successfully.`);
      startTransition(() => {
        router.refresh();
      });
    } else {
      showAlert('danger', res.message);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);

    const formData = new FormData();
    if (editCategory) formData.append('id', editCategory.id);
    formData.append('name', name);
    formData.append('sort_order', sortOrder);
    formData.append('is_hidden', isHidden ? '1' : '0');
    
    if (imageFile) {
      formData.append('image', imageFile);
    } else if (editCategory) {
      formData.append('existing_image', editCategory.image_path);
    }

    const res = await addOrUpdateCategory(formData);
    setLoading(false);

    if (res.success) {
      setFormOpen(false);
      showAlert('success', `Category "${name}" successfully ${editCategory ? 'updated' : 'created'}!`);
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

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', margin: 0 }}>Category Management</h1>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Configure deities, sorting hierarchy, and collections</span>
        </div>
        <button onClick={handleOpenCreate} className="btn-gold" style={{ fontSize: '0.8rem', padding: '10px 16px' }}>
          <i className="fas fa-plus" style={{ marginRight: '6px' }}></i> Create Category
        </button>
      </div>

      {/* Grid List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {initialCategories.map((cat) => (
          <div key={cat.id} style={{
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
              <img src={cat.image_path || '/images/placeholder.jpg'} alt={cat.name} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
              <div style={{ padding: '20px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', marginBottom: '6px' }}>{cat.name}</h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>Slug: <code>{cat.slug}</code></span>
                  <span>Sort Order: <strong>{cat.sort_order}</strong></span>
                  <span>Status:&nbsp;
                    <span style={{ fontWeight: '600', color: cat.is_hidden === 1 ? 'var(--danger)' : 'var(--success)' }}>
                      {cat.is_hidden === 1 ? 'Hidden' : 'Visible'}
                    </span>
                  </span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', borderTop: '1px solid var(--bg-cream-dark)' }}>
              <button onClick={() => handleOpenEdit(cat)} style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', borderRight: '1px solid var(--bg-cream-dark)', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--info)' }}>
                <i className="fas fa-edit" style={{ marginRight: '6px' }}></i> Edit
              </button>
              <button onClick={() => handleDelete(cat.id, cat.name)} style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--danger)' }}>
                <i className="far fa-trash-alt" style={{ marginRight: '6px' }}></i> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {formOpen && (
        <div className="admin-modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="admin-modal-content" style={{ maxWidth: '450px', width: '90%', padding: '24px' }}>
            <span className="modal-close-btn" onClick={() => setFormOpen(false)}>&times;</span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '16px' }}>
              {editCategory ? 'Edit Category' : 'Create Deity Category'}
            </h3>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Category Name *</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lord Shiva" style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Sort Order Index</label>
                <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '6px' }}>Category Banner Image</label>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} style={{ fontSize: '0.8rem' }} />
                {editCategory && !imageFile && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Using existing category image</span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="hidden-chk" checked={isHidden} onChange={(e) => setIsHidden(e.target.checked)} style={{ accentColor: 'var(--primary-gold)' }} />
                <label htmlFor="hidden-chk" style={{ fontSize: '0.85rem', cursor: 'pointer' }}><strong>Hide category</strong> (Remove from live store navigation)</label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--primary-gold-border)', paddingTop: '16px' }}>
                <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--text-muted)' }}>Cancel</button>
                <button type="submit" className="btn-gold" style={{ padding: '8px 16px', fontSize: '0.8rem' }} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
