'use client';
import { useRouter } from 'next/navigation';

export default function MobileSearchBar({ onSearchClick }) {
  const router = useRouter();

  const handleFocus = () => {
    if (onSearchClick) {
      onSearchClick();
    } else {
      router.push('/shop');
    }
  };

  return (
    <div className="mobile-search-bar-container">
      <div 
        onClick={handleFocus}
        className="mobile-search-input-wrapper"
      >
        <i className="fas fa-search mobile-search-icon"></i>
        <span className="mobile-search-placeholder">
          Search Handicrafts, Wooden Decor, Idols...
        </span>
        <i className="fas fa-sliders-h mobile-filter-icon"></i>
      </div>
    </div>
  );
}
