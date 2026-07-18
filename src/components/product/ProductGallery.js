'use client';
import { useState, useRef } from 'react';

export default function ProductGallery({ images = [] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [zoomStyle, setZoomStyle] = useState({ display: 'none' });
  const containerRef = useRef(null);

  if (images.length === 0) {
    return (
      <div style={{
        aspectRatio: '1',
        background: 'var(--bg-cream-dark)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '8px',
        border: '1px solid var(--primary-gold-border)'
      }}>
        🪷 No Images Available
      </div>
    );
  }

  const activeImage = images[activeIdx]?.image_path || '/images/placeholder.jpg';

  const handleMouseMove = (e) => {
    const container = containerRef.current;
    if (!container) return;
    const { left, top, width, height } = container.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setZoomStyle({
      display: 'block',
      backgroundImage: `url(${activeImage})`,
      backgroundPosition: `${x}% ${y}%`,
      backgroundSize: '200%' // double scale for magnify
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: 'none' });
  };

  return (
    <div>
      {/* Primary Zoom Frame */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'relative',
          aspectRatio: '1',
          width: '100%',
          overflow: 'hidden',
          borderRadius: '8px',
          border: '1px solid var(--primary-gold-border)',
          background: 'white',
          cursor: 'zoom-in',
          marginBottom: '1rem'
        }}
      >
        <img 
          src={activeImage} 
          alt="Product details" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
        
        {/* Zoom Lens Overlay */}
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundRepeat: 'no-repeat',
            transition: 'opacity 0.1s ease',
            ...zoomStyle
          }}
        />
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              onClick={() => setActiveIdx(idx)}
              style={{
                flex: '0 0 70px',
                height: '70px',
                borderRadius: '4px',
                border: activeIdx === idx 
                  ? '2px solid var(--primary-gold)' 
                  : '1px solid var(--primary-gold-border)',
                background: 'white',
                padding: '4px',
                cursor: 'pointer',
                overflow: 'hidden'
              }}
            >
              <img 
                src={img.image_path} 
                alt={`Thumbnail ${idx + 1}`} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
