'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getTrendingAndSuggestionsAction } from '@/app/actions';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

export default function SearchDrawer({ isOpen, onClose }) {
  const router = useRouter();
  const inputRef = useRef(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [trending, setTrending] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Focus search input when open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 300);
      document.body.style.overflow = 'hidden';
      
      // Load recent searches
      const saved = localStorage.getItem('anant_recent_searches');
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved));
        } catch (e) {}
      }

      // Fetch trending products
      setLoading(true);
      getTrendingAndSuggestionsAction('').then(res => {
        if (res.success) {
          setTrending(res.trending || []);
        }
        setLoading(false);
      });
    } else {
      document.body.style.overflow = 'unset';
      setSearchQuery('');
      setSuggestions([]);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Load suggestions as user types
  useEffect(() => {
    if (searchQuery.trim().length >= 1) {
      getTrendingAndSuggestionsAction(searchQuery).then(res => {
        if (res.success) {
          setSuggestions(res.suggestions || []);
        }
      });
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  const saveRecentSearch = (query) => {
    if (!query.trim()) return;
    const cleanQuery = query.trim();
    const updated = [cleanQuery, ...recentSearches.filter(q => q.toLowerCase() !== cleanQuery.toLowerCase())].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('anant_recent_searches', JSON.stringify(updated));
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    saveRecentSearch(searchQuery);
    onClose();
    router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleRecentClick = (query) => {
    saveRecentSearch(query);
    onClose();
    router.push(`/shop?search=${encodeURIComponent(query)}`);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('anant_recent_searches');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="cart-drawer-overlay open" 
      onClick={onClose}
      style={{ zIndex: 10000 }}
    >
      <div 
        className="search-drawer search-modal-drawer open"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--primary-gold-border)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          padding: '24px 20px',
          animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10001,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '100vh',
          overflowY: 'auto'
        }}
      >
        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search idols, gods, collections..."
              style={{
                width: '100%',
                padding: '12px 40px 12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--primary-gold-border)',
                fontSize: '1rem',
                outline: 'none',
                background: 'var(--bg-cream-light)',
                fontFamily: 'var(--font-body)'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                ✕
              </button>
            )}
          </div>
          <button 
            type="submit" 
            className="btn-gold" 
            style={{ padding: '12px 24px', borderRadius: '8px', fontSize: '0.9rem' }}
          >
            Search
          </button>
          <button 
            type="button" 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', fontSize: '1.25rem', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}
          >
            ✕
          </button>
        </form>

        {/* Suggestion list (if typing) */}
        {searchQuery.trim().length >= 1 ? (
          <div style={{ marginBottom: '10px' }}>
            <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary-gold-hover)', marginBottom: '12px', fontWeight: '600' }}>
              Suggestions
            </h4>
            {suggestions.length === 0 ? (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No matches found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {suggestions.map((p) => {
                  const activePrice = p.discount_price && p.discount_price > 0 ? p.discount_price : p.price;
                  return (
                    <Link
                      key={p.id}
                      href={`/product/${p.slug}`}
                      onClick={onClose}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        textDecoration: 'none',
                        color: 'inherit',
                        padding: '8px',
                        borderRadius: '6px',
                        transition: 'background 0.2s',
                        borderBottom: '1px solid rgba(0,0,0,0.03)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-cream-light)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <img 
                        src={p.image_path} 
                        alt={p.name} 
                        style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--primary-gold-border)' }} 
                      />
                      <div style={{ flex: 1 }}>
                        <span style={{ display: 'block', fontSize: '0.88rem', fontWeight: '500' }}>{p.name}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--primary-gold-hover)', fontWeight: '600' }}>{formatPrice(activePrice)}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Recent & Trending Section (default view) */
          <div>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', margin: 0, fontWeight: '600' }}>
                    Recent Searches
                  </h4>
                  <button 
                    onClick={clearRecentSearches}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                  >
                    Clear All
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {recentSearches.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleRecentClick(q)}
                      className="deity-chip"
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.78rem',
                        background: 'var(--bg-cream-light)',
                        border: '1px solid var(--primary-gold-border)',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      🕒 {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Section */}
            <div>
              <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: '600' }}>
                Trending Sculptures
              </h4>
              {loading ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading trending items...</p>
              ) : (
                <div 
                  className="trending-scroll"
                  style={{
                    display: 'flex',
                    gap: '12px',
                    overflowX: 'auto',
                    paddingBottom: '8px',
                    scrollbarWidth: 'none' // Hide scrollbar for clean app design
                  }}
                >
                  {trending.map((p) => {
                    const activePrice = p.discount_price && p.discount_price > 0 ? p.discount_price : p.price;
                    return (
                      <Link
                        key={p.id}
                        href={`/product/${p.slug}`}
                        onClick={onClose}
                        style={{
                          flex: '0 0 140px',
                          display: 'flex',
                          flexDirection: 'column',
                          textDecoration: 'none',
                          color: 'inherit',
                          background: 'white',
                          borderRadius: '8px',
                          border: '1px solid rgba(0,0,0,0.06)',
                          overflow: 'hidden',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <img 
                          src={p.image_path} 
                          alt={p.name} 
                          style={{ width: '100%', height: '110px', objectFit: 'cover' }} 
                        />
                        <div style={{ padding: '8px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: '500', 
                            display: '-webkit-box', 
                            WebkitLineClamp: 2, 
                            WebkitBoxOrient: 'vertical', 
                            overflow: 'hidden',
                            height: '32px',
                            lineHeight: '16px',
                            marginBottom: '4px'
                          }}>
                            {p.name}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--primary-gold-hover)', fontWeight: '600' }}>
                            {formatPrice(activePrice)}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
