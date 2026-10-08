import { Suspense } from 'react';
import UnsubscribeClient from '@/components/shop/UnsubscribeClient';

export const metadata = {
  title: 'Communication Preferences | Anant Arts',
  description: 'Manage your marketing communication and email newsletter preferences for Anant Arts.',
  robots: {
    index: false,
    follow: false
  }
};

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAF9F6' }}>
        <div style={{ textAlign: 'center', color: '#AA7C11' }}>
          <span style={{ fontSize: '2.5rem' }}>🪷</span>
          <p style={{ marginTop: '12px', fontSize: '0.9rem', fontWeight: '600' }}>Loading Preferences...</p>
        </div>
      </div>
    }>
      <UnsubscribeClient />
    </Suspense>
  );
}
