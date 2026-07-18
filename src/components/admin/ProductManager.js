'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteProduct, duplicateProduct, addOrUpdateProduct, bulkImportProducts } from '@/app/actions';
import { formatPrice } from '@/lib/utils';

export default function ProductManager({ initialProducts = [], categories = [] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Search & Listing States
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [sku, setSku] = useState('');
  const [stock, setStock] = useState('');
  const [material, setMaterial] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [weight, setWeight] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [tags, setTags] = useState('');
  const [isBestseller, setIsBestseller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  
  // Image files states
  const [primaryImage, setPrimaryImage] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);
  
  // CSV Import States
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);

  // Error/Success alerts
  const [alert, setAlert] = useState({ type: '', message: '' });

  const filteredProducts = initialProducts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 5000);
  };

  const handleOpenCreate = () => {
    setEditProduct(null);
    setName('');
    setPrice('');
    setDiscountPrice('');
    setSku(`AA-IDOL-${Math.floor(1000 + Math.random() * 9000)}`);
    setStock('10');
    setMaterial('Premium Brass');
    setDimensions('8 x 6 x 10 Inches');
    setWeight('3.0');
    setCategoryId(categories[0]?.id || '');
    setIsPublished(true);
    setTags('Featured, New Arrival');
    setShortDesc('');
    setDescription('');
    setPrimaryImage(null);
    setAdditionalImages([]);
    setIsBestseller(false);
    setIsNewArrival(false);
    setIsFeatured(false);
    setVideoUrl('');
    setSeoTitle('');
    setSeoDescription('');
    setFormOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditProduct(p);
    setName(p.name);
    setPrice(p.price);
    setDiscountPrice(p.discount_price || '');
    setSku(p.sku || '');
    setStock(p.stock_quantity || '0');
    setMaterial(p.material || '');
    setDimensions(p.dimensions || '');
    setWeight(p.weight || '');
    setCategoryId(p.category_id || '');
    setIsPublished(p.is_published === 1);
    
    let tagsStr = '';
    try {
      if (p.tags) {
        const parsed = typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags;
        tagsStr = Array.isArray(parsed) ? parsed.join(', ') : '';
      }
    } catch (e) {
      tagsStr = p.tags || '';
    }
    setTags(tagsStr);
    
    setShortDesc(p.short_description || '');
    setDescription(p.description || '');
    setPrimaryImage(null);
    setAdditionalImages([]);
    setIsBestseller(p.is_bestseller === 1);
    setIsNewArrival(p.is_new_arrival === 1);
    setIsFeatured(p.is_featured === 1);
    setVideoUrl(p.video_url || '');
    setSeoTitle(p.seo_title || '');
    setSeoDescription(p.seo_description || '');
    setFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !sku) return;
    setLoading(true);

    const formData = new FormData();
    if (editProduct) formData.append('id', editProduct.id);
    formData.append('name', name);
    formData.append('price', price);
    if (discountPrice) formData.append('discount_price', discountPrice);
    formData.append('sku', sku);
    formData.append('stock_quantity', stock);
    formData.append('material', material);
    formData.append('dimensions', dimensions);
    if (weight) formData.append('weight', weight);
    formData.append('category_id', categoryId);
    formData.append('is_published', isPublished ? '1' : '0');
    formData.append('tags', tags);
    formData.append('short_description', shortDesc);
    formData.append('description', description);
    formData.append('is_bestseller', isBestseller ? '1' : '0');
    formData.append('is_new_arrival', isNewArrival ? '1' : '0');
    formData.append('is_featured', isFeatured ? '1' : '0');
    formData.append('video_url', videoUrl);
    formData.append('seo_title', seoTitle);
    formData.append('seo_description', seoDescription);

    if (primaryImage) {
      formData.append('primary_image', primaryImage);
    } else if (editProduct) {
      formData.append('existing_primary_image', editProduct.image_path);
    }

    additionalImages.forEach(img => {
      formData.append('additional_images', img);
    });

    const res = await addOrUpdateProduct(formData);
    setLoading(false);

    if (res.success) {
      setFormOpen(false);
      showAlert('success', `Product "${name}" successfully ${editProduct ? 'updated' : 'created'}!`);
      startTransition(() => {
        router.refresh();
      });
    } else {
      showAlert('danger', res.message);
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Are you sure you want to delete product "${title}"?`)) return;
    const res = await deleteProduct(id);
    if (res.success) {
      showAlert('success', `Product deleted successfully.`);
      startTransition(() => {
        router.refresh();
      });
    } else {
      showAlert('danger', res.message);
    }
  };

  const handleDuplicate = async (id, title) => {
    const res = await duplicateProduct(id);
    if (res.success) {
      showAlert('success', `Cloned duplicate of "${title}" created successfully!`);
      startTransition(() => {
        router.refresh();
      });
    } else {
      showAlert('danger', res.message);
    }
  };

  // Simple CSV Parser
  const handleCSVImport = async (e) => {
    e.preventDefault();
    if (!csvText.trim()) return;
    setImporting(true);
    
    try {
      const lines = csvText.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const parsedProducts = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Simple column split ignoring commas inside quotes is complex, 
        // but for standard flat CSV we split by comma
        const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length >= headers.length) {
          const obj = {};
          headers.forEach((h, idx) => {
            obj[h] = cols[idx];
          });
          parsedProducts.push(obj);
        }
      }

      if (parsedProducts.length === 0) {
        throw new Error('No products parsed from CSV text.');
      }

      const res = await bulkImportProducts(parsedProducts);
      if (res.success) {
        showAlert('success', `Successfully imported ${parsedProducts.length} products!`);
        setCsvText('');
        setCsvModalOpen(false);
        startTransition(() => {
          router.refresh();
        });
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      showAlert('danger', err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['name', 'category_slug', 'price', 'discount_price', 'sku', 'material', 'dimensions', 'weight', 'stock_quantity', 'tags', 'image_url', 'description'];
    const csvRows = [headers.join(',')];

    initialProducts.forEach(p => {
      const row = [
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.category_slug || ''}"`,
        p.price,
        p.discount_price || '',
        `"${p.sku || ''}"`,
        `"${(p.material || '').replace(/"/g, '""')}"`,
        `"${(p.dimensions || '').replace(/"/g, '""')}"`,
        p.weight || '',
        p.stock_quantity,
        `"${p.tags ? JSON.parse(p.tags).join(', ') : ''}"`,
        `"${p.image_path || ''}"`,
        `"${(p.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `anant-arts-products-${Date.now()}.csv`);
    a.click();
  };

  const [loading, setLoading] = useState(false);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', margin: 0 }}>Product Inventory</h1>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manage catalog list, bulk upload, and duplications</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportCSV} className="btn-outline-gold" style={{ fontSize: '0.8rem', padding: '10px 16px' }}>
            <i className="fas fa-file-export" style={{ marginRight: '6px' }}></i> Export CSV
          </button>
          <button onClick={() => setCsvModalOpen(true)} className="btn-outline-gold" style={{ fontSize: '0.8rem', padding: '10px 16px' }}>
            <i className="fas fa-file-import" style={{ marginRight: '6px' }}></i> Bulk Upload
          </button>
          <button onClick={handleOpenCreate} className="btn-gold" style={{ fontSize: '0.8rem', padding: '10px 16px' }}>
            <i className="fas fa-plus" style={{ marginRight: '6px' }}></i> Add New Idol
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div style={{ background: 'white', padding: '16px 20px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="Search by name, sku..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid var(--primary-gold-border)',
              fontSize: '0.82rem'
            }}
          />
        </div>
      </div>

      {/* Table grid */}
      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--bg-cream-dark)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '12px' }}>Image</th>
              <th style={{ padding: '12px' }}>Idol Name</th>
              <th style={{ padding: '12px' }}>SKU</th>
              <th style={{ padding: '12px' }}>Price</th>
              <th style={{ padding: '12px' }}>Discounted</th>
              <th style={{ padding: '12px' }}>Stock</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No products match the filter search.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--bg-cream-dark)' }}>
                  <td style={{ padding: '12px' }}>
                    <img src={p.image_path} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--primary-gold-border)' }} />
                  </td>
                  <td style={{ padding: '12px', fontWeight: '600' }}>{p.name}</td>
                  <td style={{ padding: '12px' }}>{p.sku}</td>
                  <td style={{ padding: '12px' }}>{formatPrice(p.price)}</td>
                  <td style={{ padding: '12px' }}>{p.discount_price ? formatPrice(p.discount_price) : '-'}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      fontWeight: '600',
                      color: p.stock_quantity < 5 ? 'var(--danger)' : 'var(--text-dark)'
                    }}>
                      {p.stock_quantity} pcs
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.68rem',
                      fontWeight: '600',
                      backgroundColor: p.is_published === 1 ? 'rgba(46,125,50,0.1)' : 'rgba(110,90,90,0.1)',
                      color: p.is_published === 1 ? 'var(--success)' : 'var(--text-muted)'
                    }}>
                      {p.is_published === 1 ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center', height: '65px' }}>
                    <button onClick={() => handleOpenEdit(p)} className="header-icon" title="Edit" style={{ color: 'var(--info)' }}><i className="fas fa-edit"></i></button>
                    <button onClick={() => handleDuplicate(p.id, p.name)} className="header-icon" title="Duplicate" style={{ color: 'var(--primary-gold-hover)' }}><i className="fas fa-copy"></i></button>
                    <button onClick={() => handleDelete(p.id, p.name)} className="header-icon" title="Delete" style={{ color: 'var(--danger)' }}><i className="far fa-trash-alt"></i></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk Upload Modal */}
      {csvModalOpen && (
        <div className="admin-modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="admin-modal-content" style={{ maxWidth: '500px', width: '90%', padding: '24px' }}>
            <span className="modal-close-btn" onClick={() => setCsvModalOpen(false)}>&times;</span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '12px' }}>Bulk Import Products</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Paste your comma-separated values (CSV) text below. The first row must define column headers (e.g. <code>name,category_slug,price,discount_price,sku,stock_quantity,tags,image_url,description</code>).
            </p>
            <form onSubmit={handleCSVImport}>
              <textarea
                rows="8"
                required
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="name,category_slug,price,discount_price,sku,stock_quantity,tags,image_url,description&#10;Ganesha electroplate,lord-ganesha,15000,,AA-GAN-99,10,Featured,https://image-link.com,description text"
                style={{ width: '100%', padding: '10px', fontSize: '0.75rem', fontFamily: 'monospace', border: '1px solid var(--primary-gold-border)', borderRadius: '4px', marginBottom: '16px' }}
              ></textarea>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setCsvModalOpen(false)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--text-muted)' }}>Cancel</button>
                <button type="submit" className="btn-gold" style={{ padding: '8px 16px', fontSize: '0.8rem' }} disabled={importing}>
                  {importing ? 'Importing...' : 'Start Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {formOpen && (
        <div className="admin-modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, overflowY: 'auto' }}>
          <div className="admin-modal-content" style={{ maxWidth: '750px', width: '90%', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <span className="modal-close-btn" onClick={() => setFormOpen(false)}>&times;</span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '16px' }}>
              {editProduct ? 'Edit Idol Specifications' : 'Add New Electroplated Idol'}
            </h3>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Product Title *</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>SKU Code *</label>
                  <input type="text" required value={sku} onChange={(e) => setSku(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Base Price (₹) *</label>
                  <input type="number" required value={price} onChange={(e) => setPrice(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Discount Price (₹)</label>
                  <input type="number" value={discountPrice} onChange={(e) => setDiscountPrice(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Stock Quantity *</label>
                  <input type="number" required value={stock} onChange={(e) => setStock(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Category *</label>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px', background: 'white' }}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Featured Tags (comma separated)</label>
                  <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Featured, Best Seller" style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Material specifications</label>
                  <input type="text" value={material} onChange={(e) => setMaterial(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Dimensions (L x W x H)</label>
                  <input type="text" value={dimensions} onChange={(e) => setDimensions(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Weight (kg)</label>
                  <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
                </div>
              </div>

              {/* Upload sections */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', border: '1px dashed var(--primary-gold)', padding: '16px', borderRadius: '6px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>Primary Cover Photo</label>
                  <input type="file" accept="image/*" onChange={(e) => setPrimaryImage(e.target.files[0])} style={{ fontSize: '0.8rem' }} />
                  {editProduct && !primaryImage && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Using existing photo</span>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>Additional Thumbnails</label>
                  <input type="file" accept="image/*" multiple onChange={(e) => setAdditionalImages(Array.from(e.target.files))} style={{ fontSize: '0.8rem' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Short Description</label>
                <input type="text" value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Detailed Description</label>
                <textarea rows="4" value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px', fontFamily: 'var(--font-body)', fontSize: '0.85rem' }}></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', borderTop: '1px solid var(--primary-gold-border)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" id="bestseller-chk" checked={isBestseller} onChange={(e) => setIsBestseller(e.target.checked)} style={{ accentColor: 'var(--primary-gold)', cursor: 'pointer' }} />
                  <label htmlFor="bestseller-chk" style={{ fontSize: '0.8rem', cursor: 'pointer' }}>Mark Best Seller</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" id="newarrival-chk" checked={isNewArrival} onChange={(e) => setIsNewArrival(e.target.checked)} style={{ accentColor: 'var(--primary-gold)', cursor: 'pointer' }} />
                  <label htmlFor="newarrival-chk" style={{ fontSize: '0.8rem', cursor: 'pointer' }}>Mark New Arrival</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" id="featured-chk" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} style={{ accentColor: 'var(--primary-gold)', cursor: 'pointer' }} />
                  <label htmlFor="featured-chk" style={{ fontSize: '0.8rem', cursor: 'pointer' }}>Mark Featured</label>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Product Demonstration Video URL</label>
                <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid var(--primary-gold-border)', paddingTop: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Meta Title Tag (SEO)</label>
                  <input type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Luxury Ganesha Idol | Anant Arts" style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Meta Description Tag (SEO)</label>
                  <input type="text" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} placeholder="Buy exquisite 24k gold plated Ganesha..." style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid var(--primary-gold-border)', paddingTop: '16px' }}>
                <input type="checkbox" id="published-chk" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} style={{ accentColor: 'var(--primary-gold)', cursor: 'pointer' }} />
                <label htmlFor="published-chk" style={{ fontSize: '0.85rem', cursor: 'pointer' }}><strong>Publish immediately</strong> (Make visible on live catalog)</label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--primary-gold-border)', paddingTop: '16px' }}>
                <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--text-muted)' }}>Cancel</button>
                <button type="submit" className="btn-gold" style={{ padding: '8px 16px', fontSize: '0.8rem' }} disabled={loading}>
                  {loading ? 'Saving specifications...' : 'Save Product Specs'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
