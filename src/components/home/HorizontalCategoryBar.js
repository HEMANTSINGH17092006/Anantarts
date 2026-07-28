'use client';
import Link from 'next/link';

const CATEGORY_ITEMS = [
  { name: 'Spiritual', icon: '🪔', link: '/shop?category=spiritual-collection' },
  { name: 'Wooden', icon: '🪵', link: '/shop?category=wooden-handicrafts' },
  { name: 'Home Decor', icon: '🏡', link: '/shop?category=home-decor' },
  { name: 'Corporate', icon: '🎁', link: '/corporate-gifts' },
  { name: 'Customized', icon: '✨', link: '/shop?category=customized-gifts' },
  { name: 'Festival', icon: '🎄', link: '/shop?category=festival-collection' },
  { name: 'New Arrivals', icon: '🆕', link: '/shop?tag=New+Arrival' }
];

export default function HorizontalCategoryBar() {
  return (
    <div className="horizontal-category-bar-wrapper">
      <div className="horizontal-category-scroll">
        {CATEGORY_ITEMS.map((item, idx) => (
          <Link
            key={idx}
            href={item.link}
            className="category-pill-item"
          >
            <span className="category-pill-icon">{item.icon}</span>
            <span className="category-pill-name">{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
