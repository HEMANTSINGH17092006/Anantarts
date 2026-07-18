import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { sendAdminOrderNotification } from '@/lib/whatsapp';

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", 
  "Ladakh", "Lakshadweep", "Puducherry"
];

function sanitizeInput(str) {
  if (!str) return '';
  // Strip any HTML tags to prevent XSS
  return str.replace(/<[^>]*>/g, '').trim();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      order_number,
      customer_name,
      customer_email,
      customer_phone,
      street_address,
      city,
      state,
      zip,
      landmark,
      coupon_id,
      discount_amount,
      shipping_charge,
      subtotal,
      total_amount,
      payment_method,
      payment_status,
      payment_id,
      items
    } = body;

    // 1. Mandatory base fields presence check
    if (!order_number || !customer_name || !customer_email || !customer_phone || !street_address || !city || !state || !zip || !items || items.length === 0) {
      return NextResponse.json({ message: 'Missing required order details.' }, { status: 400 });
    }

    // 2. Perform server-side validation & sanitization
    const sanitizedName = sanitizeInput(customer_name);
    const sanitizedEmail = sanitizeInput(customer_email);
    const sanitizedPhone = sanitizeInput(customer_phone);
    const sanitizedStreet = sanitizeInput(street_address);
    const sanitizedCity = sanitizeInput(city);
    const sanitizedState = sanitizeInput(state);
    const sanitizedZip = sanitizeInput(zip);
    const sanitizedLandmark = sanitizeInput(landmark);

    if (!/^[a-zA-Z\s]{3,50}$/.test(sanitizedName)) {
      return NextResponse.json({ message: 'Please enter a valid full name.' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
      return NextResponse.json({ message: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (!/^[6-9][0-9]{9}$/.test(sanitizedPhone)) {
      return NextResponse.json({ message: 'Please enter a valid 10-digit mobile number.' }, { status: 400 });
    }

    if (sanitizedStreet.length < 10 || sanitizedStreet.length > 200) {
      return NextResponse.json({ message: 'Please enter a complete delivery address.' }, { status: 400 });
    }

    if (!/^[a-zA-Z\s]+$/.test(sanitizedCity)) {
      return NextResponse.json({ message: 'Please enter a valid city name.' }, { status: 400 });
    }

    if (!INDIAN_STATES.includes(sanitizedState)) {
      return NextResponse.json({ message: 'Please select your state.' }, { status: 400 });
    }

    if (!/^[1-9][0-9]{5}$/.test(sanitizedZip)) {
      return NextResponse.json({ message: 'Please enter a valid 6-digit postal code.' }, { status: 400 });
    }

    if (sanitizedLandmark && sanitizedLandmark.length > 100) {
      return NextResponse.json({ message: 'Landmark cannot exceed 100 characters.' }, { status: 400 });
    }

    // Compose final clean address string for storage
    const shipping_address = `${sanitizedStreet}, ${sanitizedLandmark ? sanitizedLandmark + ', ' : ''}${sanitizedCity}, ${sanitizedState} - ${sanitizedZip}, India`;
    const billing_address = shipping_address;

    // Use service role admin client to bypass RLS and perform database insertions
    const supabase = createAdminClient();

    // 1. Verify stock availability for all products before creating the order
    for (const item of items) {
      const { data: prod, error: prodErr } = await supabase
        .from('products')
        .select('name, stock_quantity')
        .eq('id', item.product_id)
        .single();

      if (prodErr || !prod) {
        return NextResponse.json({ message: `Product check failed for item: ${item.product_name}.` }, { status: 400 });
      }

      if (prod.stock_quantity < item.quantity) {
        return NextResponse.json({ 
          message: `Insufficient stock for product "${prod.name}". Only ${prod.stock_quantity} left in stock.` 
        }, { status: 400 });
      }
    }

    // 2. Insert order record
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_number,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        billing_address,
        coupon_id,
        discount_amount,
        shipping_charge,
        subtotal,
        total_amount,
        payment_method,
        payment_status: payment_status || 'Pending',
        order_status: 'Pending',
        notes: payment_id ? `Payment Gateway Transaction ID: ${paymentId}` : ''
      })
      .select('*')
      .single();

    if (orderErr || !order) {
      console.error('Order Insert Error:', orderErr);
      return NextResponse.json({ message: 'Failed to create order record.' }, { status: 500 });
    }

    // 3. Process items, adjust stock levels, and check stock warnings
    for (const item of items) {
      // Insert order item
      const { error: itemErr } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.product_name,
          price: item.price,
          quantity: item.quantity,
          total_price: item.price * item.quantity
        });

      if (itemErr) {
        console.error('Order Item Insert Error:', itemErr);
        // Continue but log error
      }

      // Fetch current stock to subtract
      const { data: prod } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', item.product_id)
        .single();
        
      const nextStock = Math.max(0, prod.stock_quantity - item.quantity);

      // Update product stock
      await supabase
        .from('products')
        .update({ stock_quantity: nextStock })
        .eq('id', item.product_id);

      // Low Stock Alert Notification
      if (nextStock < 5) {
        await supabase
          .from('notifications')
          .insert({
            message: `⚠️ Low Stock Alert: Product "${item.product_name}" is down to ${nextStock} items in inventory.`,
            is_read: 0,
            type: 'warning',
            link: `/admin/products?search=${encodeURIComponent(item.product_name)}`
          });
      }
    }

    // 4. Update coupon usage count if coupon applied
    if (coupon_id) {
      const { data: c } = await supabase.from('coupons').select('times_used').eq('id', coupon_id).single();
      if (c) {
        await supabase
          .from('coupons')
          .update({ times_used: (c.times_used || 0) + 1 })
          .eq('id', coupon_id);
      }
    }

    // 5. Create general order alert notification for Admin
    await supabase
      .from('notifications')
      .insert({
        message: `🎉 New Order Registered: Order ${order_number} placed by ${customer_name} for ${formatPrice(total_amount)}.`,
        is_read: 0,
        type: 'success',
        link: `/admin/orders`
      });

    // 6. Send WhatsApp Notification
    try {
      const { data: settingsData } = await supabase.from('website_settings').select('*');
      const settings = {};
      if (settingsData) {
        settingsData.forEach(r => { settings[r.key] = r.value; });
        // Don't await this so it doesn't block the API response
        sendAdminOrderNotification(order, items, settings).catch(e => console.error('WhatsApp Error:', e));
      }
    } catch (e) {
      console.error('Failed to prepare WhatsApp notification', e);
    }

    return NextResponse.json({ success: true, order });
  } catch (err) {
    console.error('Order Process Error:', err);
    return NextResponse.json({ message: 'Internal Server Error while completing check-out.' }, { status: 500 });
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(price);
}
