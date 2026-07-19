import { getSessionCustomer } from '../auth/actions';
import ProfileSettingsClient from './ProfileSettingsClient';

export const metadata = {
  title: 'My Profile - Anant Arts',
};

export default async function AccountProfilePage() {
  const customer = await getSessionCustomer();

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 24px 0', fontSize: '1.5rem', color: '#333' }}>Profile Settings</h2>
      
      <ProfileSettingsClient customer={customer} />
      
      <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '24px' }}>
        * To update your mobile number or email, please contact customer support.
      </p>
    </div>
  );
}
