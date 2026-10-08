import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Anant Arts — Customer Intelligence & Multi-Filter Segmentation Service
 * Unifies customer data across orders, accounts, newsletter subscriptions,
 * consultations, and consent preferences.
 */

/**
 * Clean & normalize phone number
 */
export function normalizePhoneNumber(phone) {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, '');
  if (digits.length === 10) digits = '91' + digits;
  return digits.length >= 10 ? digits : null;
}

/**
 * Extracts city & state from raw shipping address string
 */
function extractLocation(addressStr) {
  if (!addressStr || typeof addressStr !== 'string') return { city: '', state: '' };
  const parts = addressStr.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const cityCandidate = parts[parts.length - 2] || '';
    const stateCandidate = parts[parts.length - 1] || '';
    return {
      city: cityCandidate.replace(/\d+/g, '').trim(),
      state: stateCandidate.replace(/\d+/g, '').trim()
    };
  }
  return { city: '', state: '' };
}

/**
 * Fetch and aggregate unified customer records
 */
export async function getAllMarketingCustomers() {
  const supabase = createAdminClient();

  try {
    // 1. Fetch all data sources concurrently with defensive fallbacks
    const [
      orders,
      orderItems,
      users,
      addresses,
      subscribers,
      consultations,
      enquiries,
      preferences
    ] = await Promise.all([
      supabase.from('orders').select('id, user_id, order_number, customer_name, customer_email, customer_phone, shipping_address, total_amount, payment_status, order_status, created_at').order('created_at', { ascending: false }).then(r => r.data || []).catch(() => []),
      supabase.from('order_items').select('order_id, product_name, price, quantity, total_price').then(r => r.data || []).catch(() => []),
      supabase.from('users').select('id, email, full_name, phone, created_at').then(r => r.data || []).catch(() => []),
      supabase.from('user_addresses').select('user_id, city, state, pincode').then(r => r.data || []).catch(() => []),
      supabase.from('newsletter_subscribers').select('email, subscribed_at').then(r => r.data || []).catch(() => []),
      supabase.from('consultations').select('name, phone, whatsapp, city, deity_interest, created_at').then(r => r.data || []).catch(() => []),
      supabase.from('b2b_enquiries').select('name, email, phone, company, product_interest, created_at').then(r => r.data || []).catch(() => []),
      supabase.from('communication_preferences').select('email, phone, email_marketing_opt_in, whatsapp_marketing_opt_in, unsubscribed_at, unsubscribe_reason').then(r => r.data || []).catch(() => [])
    ]);

    // Map order items by order ID for fast lookup
    const orderItemsMap = {};
    orderItems.forEach(item => {
      if (!orderItemsMap[item.order_id]) orderItemsMap[item.order_id] = [];
      orderItemsMap[item.order_id].push(item);
    });

    // Map communication preferences by email and phone
    const prefByEmail = {};
    const prefByPhone = {};
    preferences.forEach(p => {
      if (p.email) prefByEmail[p.email.toLowerCase().trim()] = p;
      if (p.phone) prefByPhone[normalizePhoneNumber(p.phone)] = p;
    });

    // Map user addresses by user_id
    const addressesByUserId = {};
    addresses.forEach(a => {
      if (!addressesByUserId[a.user_id]) addressesByUserId[a.user_id] = [];
      addressesByUserId[a.user_id].push(a);
    });

    // Master customer directory keyed by normalized email (or normalized phone)
    const customerMap = {};

    function getOrCreateCustomer(email, phone, defaultName = '') {
      const cleanEmail = email ? email.toLowerCase().trim() : null;
      const cleanPhone = normalizePhoneNumber(phone);
      const key = cleanEmail || (cleanPhone ? `phone_${cleanPhone}` : null);

      if (!key) return null;

      if (!customerMap[key]) {
        customerMap[key] = {
          key,
          user_id: null,
          name: defaultName || 'Devotee',
          email: cleanEmail || '',
          phone: cleanPhone || '',
          total_orders: 0,
          total_spent: 0,
          orders: [],
          purchased_categories: {},
          first_order_date: null,
          last_order_date: null,
          customer_since: null,
          city: '',
          state: '',
          source: 'order',
          has_pending_cart: false,
          email_marketing_opt_in: 1,
          whatsapp_marketing_opt_in: 1,
          unsubscribed_at: null,
          unsubscribe_reason: null
        };
      }

      if (defaultName && customerMap[key].name === 'Devotee') {
        customerMap[key].name = defaultName;
      }

      if (cleanPhone && !customerMap[key].phone) {
        customerMap[key].phone = cleanPhone;
      }

      return customerMap[key];
    }

    // Process Orders
    orders.forEach(o => {
      const c = getOrCreateCustomer(o.customer_email, o.customer_phone, o.customer_name);
      if (!c) return;

      if (o.user_id && !c.user_id) c.user_id = o.user_id;
      if (o.customer_name && o.customer_name.trim()) c.name = o.customer_name.trim();

      const isPaid = o.payment_status === 'Paid' || o.payment_status === 'Captured' || o.payment_status === 'Completed' || o.order_status === 'Delivered' || o.order_status === 'Shipped' || o.order_status === 'Processing';

      if (isPaid) {
        c.total_orders += 1;
        c.total_spent += Number(o.total_amount) || 0;
      } else if (o.payment_status === 'Pending' || o.payment_status === 'Failed' || o.order_status === 'Pending') {
        c.has_pending_cart = true;
      }

      const orderDate = new Date(o.created_at);
      if (!c.first_order_date || orderDate < new Date(c.first_order_date)) {
        c.first_order_date = o.created_at;
      }
      if (!c.last_order_date || orderDate > new Date(c.last_order_date)) {
        c.last_order_date = o.created_at;
      }
      if (!c.customer_since || orderDate < new Date(c.customer_since)) {
        c.customer_since = o.created_at;
      }

      // Location from address
      if (!c.city && o.shipping_address) {
        const loc = extractLocation(o.shipping_address);
        c.city = loc.city;
        c.state = loc.state;
      }

      // Track categories/items
      const items = orderItemsMap[o.id] || [];
      items.forEach(it => {
        const prodName = it.product_name || '';
        let detectedCategory = 'Spiritual Collection';
        if (/ganesha|ganesh/i.test(prodName)) detectedCategory = 'Ganesha Collection';
        else if (/krishna|radha/i.test(prodName)) detectedCategory = 'Krishna Collection';
        else if (/shiva|mahadev|lingam/i.test(prodName)) detectedCategory = 'Shiva Collection';
        else if (/lakshmi|laxmi/i.test(prodName)) detectedCategory = 'Lakshmi Collection';
        else if (/hanuman|maruti/i.test(prodName)) detectedCategory = 'Hanuman Collection';
        else if (/clock|organizer|desk/i.test(prodName)) detectedCategory = 'Corporate Gifts';
        else if (/leaf|decor|accent/i.test(prodName)) detectedCategory = 'Home Décor';

        c.purchased_categories[detectedCategory] = (c.purchased_categories[detectedCategory] || 0) + (it.quantity || 1);
      });
    });

    // Process Registered Users
    users.forEach(u => {
      const userName = u.full_name || u.name || '';
      const c = getOrCreateCustomer(u.email, u.phone, userName);
      if (c) {
        c.user_id = u.id;
        if (userName && c.name === 'Devotee') c.name = userName;
        if (!c.customer_since || new Date(u.created_at) < new Date(c.customer_since)) {
          c.customer_since = u.created_at;
        }
        c.source = 'registered_user';

        // Check user addresses
        const userAddrs = addressesByUserId[u.id] || [];
        if (userAddrs.length > 0 && !c.city) {
          c.city = userAddrs[0].city || '';
          c.state = userAddrs[0].state || '';
        }
      }
    });

    // Process Newsletter Subscribers
    subscribers.forEach(s => {
      const c = getOrCreateCustomer(s.email, null, '');
      if (c) {
        if (!c.customer_since) c.customer_since = s.subscribed_at;
        if (c.source !== 'registered_user' && c.total_orders === 0) {
          c.source = 'newsletter_subscriber';
        }
      }
    });

    // Process Consultations
    consultations.forEach(con => {
      const c = getOrCreateCustomer(null, con.whatsapp || con.phone, con.name);
      if (c) {
        if (con.name && c.name === 'Devotee') c.name = con.name;
        if (con.city && !c.city) c.city = con.city;
        if (con.deity_interest) {
          c.purchased_categories[con.deity_interest] = (c.purchased_categories[con.deity_interest] || 0) + 1;
        }
        if (!c.customer_since) c.customer_since = con.created_at;
      }
    });

    // Process B2B Enquiries
    enquiries.forEach(enq => {
      const c = getOrCreateCustomer(enq.email, enq.phone, enq.name);
      if (c) {
        if (enq.name && c.name === 'Devotee') c.name = enq.name;
        if (enq.product_interest) {
          c.purchased_categories[enq.product_interest] = (c.purchased_categories[enq.product_interest] || 0) + 1;
        }
        if (!c.customer_since) c.customer_since = enq.created_at;
      }
    });

    // Apply Consent Preferences & Final Computations
    const now = Date.now();
    const finalCustomers = Object.values(customerMap).map(c => {
      // Preference overrides
      const emailPref = c.email ? prefByEmail[c.email.toLowerCase()] : null;
      const phonePref = c.phone ? prefByPhone[c.phone] : null;

      if (emailPref) {
        c.email_marketing_opt_in = emailPref.email_marketing_opt_in;
        c.unsubscribed_at = emailPref.unsubscribed_at;
        c.unsubscribe_reason = emailPref.unsubscribe_reason;
      }
      if (phonePref) {
        c.whatsapp_marketing_opt_in = phonePref.whatsapp_marketing_opt_in;
      }

      // Calculate days since last order
      if (c.last_order_date) {
        c.days_since_last_order = Math.floor((now - new Date(c.last_order_date).getTime()) / (1000 * 60 * 60 * 24));
      } else {
        c.days_since_last_order = null;
      }

      // Preferred Category
      const topCat = Object.entries(c.purchased_categories)
        .sort((a, b) => b[1] - a[1])[0];
      c.preferred_category = topCat ? topCat[0] : 'Spiritual Collection';

      // Customer Tier
      if (c.total_spent >= 20000) {
        c.tier = 'VIP Patron';
      } else if (c.total_spent >= 8000) {
        c.tier = 'High Value';
      } else if (c.total_orders >= 2) {
        c.tier = 'Repeat Devotee';
      } else if (c.total_orders === 1) {
        c.tier = 'New Customer';
      } else if (c.has_pending_cart) {
        c.tier = 'Incomplete Sanctuary';
      } else {
        c.tier = 'Subscriber / Lead';
      }

      return c;
    });

    // Sort by total spent descending, then last order date
    finalCustomers.sort((a, b) => {
      if (b.total_spent !== a.total_spent) return b.total_spent - a.total_spent;
      if (b.last_order_date && a.last_order_date) {
        return new Date(b.last_order_date).getTime() - new Date(a.last_order_date).getTime();
      }
      return 0;
    });

    return finalCustomers;
  } catch (err) {
    console.error('[Customer Intelligence Error]:', err);
    return [];
  }
}

/**
 * Filter customers dynamically based on segment configuration
 */
export function filterCustomersBySegment(customers = [], config = {}) {
  const {
    segment_type = 'all',
    min_spent = 0,
    max_spent = null,
    min_orders = 0,
    max_orders = null,
    days_inactive = null,
    category_name = '',
    city = '',
    channel = 'all', // 'email' | 'whatsapp' | 'all'
    only_opted_in = true,
    search_query = '',
    manual_keys = []
  } = config;

  return customers.filter(c => {
    // Channel-specific validity & Consent check
    if (channel === 'email') {
      if (!c.email || !c.email.includes('@')) return false;
      if (only_opted_in && c.email_marketing_opt_in === 0) return false;
    } else if (channel === 'whatsapp') {
      if (!c.phone || c.phone.length < 10) return false;
      if (only_opted_in && c.whatsapp_marketing_opt_in === 0) return false;
    } else {
      if (only_opted_in && (c.email_marketing_opt_in === 0 && c.whatsapp_marketing_opt_in === 0)) return false;
    }

    // Search query
    if (search_query) {
      const q = search_query.toLowerCase();
      const matchName = c.name?.toLowerCase().includes(q);
      const matchEmail = c.email?.toLowerCase().includes(q);
      const matchPhone = c.phone?.toLowerCase().includes(q);
      const matchCity = c.city?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone && !matchCity) return false;
    }

    // Segment Preset Filters
    switch (segment_type) {
      case 'new':
        if (c.total_orders !== 1) return false;
        break;
      case 'repeat':
        if (c.total_orders < 2) return false;
        break;
      case 'high_value':
        if (c.total_spent < (min_spent || 5000)) return false;
        break;
      case 'inactive_30':
        if (c.total_orders === 0 || (c.days_since_last_order !== null && c.days_since_last_order < 30)) return false;
        break;
      case 'inactive_60':
        if (c.total_orders === 0 || (c.days_since_last_order !== null && c.days_since_last_order < 60)) return false;
        break;
      case 'inactive_90':
        if (c.total_orders === 0 || (c.days_since_last_order !== null && c.days_since_last_order < 90)) return false;
        break;
      case 'abandoned_pending':
        if (!c.has_pending_cart) return false;
        break;
      case 'category_interest':
        if (category_name && c.preferred_category !== category_name && !c.purchased_categories[category_name]) {
          return false;
        }
        break;
      case 'location':
        if (city && !c.city?.toLowerCase().includes(city.toLowerCase()) && !c.state?.toLowerCase().includes(city.toLowerCase())) {
          return false;
        }
        break;
      case 'manual':
        if (Array.isArray(manual_keys) && manual_keys.length > 0) {
          if (!manual_keys.includes(c.key) && !manual_keys.includes(c.email) && !manual_keys.includes(c.phone)) {
            return false;
          }
        }
        break;
      case 'all':
      default:
        break;
    }

    // Numerical criteria
    if (min_spent > 0 && c.total_spent < min_spent) return false;
    if (max_spent !== null && max_spent > 0 && c.total_spent > max_spent) return false;
    if (min_orders > 0 && c.total_orders < min_orders) return false;
    if (max_orders !== null && max_orders > 0 && c.total_orders > max_orders) return false;
    if (days_inactive !== null && days_inactive > 0) {
      if (c.days_since_last_order === null || c.days_since_last_order < days_inactive) return false;
    }

    return true;
  });
}

/**
 * Get Audience Preview and Counts
 */
export async function getSegmentPreview(config = {}) {
  const allCustomers = await getAllMarketingCustomers();
  const matched = filterCustomersBySegment(allCustomers, config);

  const emailEligible = matched.filter(c => c.email && c.email.includes('@') && c.email_marketing_opt_in !== 0);
  const whatsappEligible = matched.filter(c => c.phone && c.phone.length >= 10 && c.whatsapp_marketing_opt_in !== 0);

  return {
    total_customers: allCustomers.length,
    matching_count: matched.length,
    email_eligible_count: emailEligible.length,
    whatsapp_eligible_count: whatsappEligible.length,
    sample: matched.slice(0, 50),
    segment_type: config.segment_type || 'all'
  };
}
