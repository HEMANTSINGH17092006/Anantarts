import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { sendAdminOrderNotification } from '@/lib/whatsapp';
import { sendAdminNewOrderEmail, sendAdminLowStockEmail } from '@/lib/admin-email';
import { getSessionCustomer } from '../../../auth/actions';
import { validateAndCalculateOrderPrices } from '@/lib/order-pricing';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  return String(str).replace(/<[^>]*>/g, '').trim();
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(price);
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
      discount_amount: clientDiscountAmount,
      shipping_charge: clientShippingCharge,
      subtotal: clientSubtotal,
      total_amount: clientTotalAmount,
      currency = 'INR',
      payment_method,
      payment_status,
      payment_id,
      utr,
      notes,
      items,
      create_account
    } = body;

    // Currency verification: strictly INR only
    if (currency && String(currency).toUpperCase() !== 'INR') {
      return NextResponse.json({ message: 'Invalid currency. Only INR transactions are supported.' }, { status: 400 });
    }

    // Block new Cash on Delivery (COD) orders
    if (payment_method && String(payment_method).toUpperCase() === 'COD') {
      return NextResponse.json({
        message: 'Cash on Delivery (COD) is no longer available. Please choose Razorpay Online or Direct UPI QR.'
      }, { status: 400 });
    }

    // 1. Mandatory base fields presence check
    if (!order_number || !customer_name || !customer_email || !customer_phone || !street_address || !city || !state || !zip || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: 'Missing required order details.' }, { status: 400 });
    }

    // 2. Perform server-side validation & sanitization
    const sanitizedName = sanitizeInput(customer_name);
    const sanitizedEmail = sanitizeInput(customer_email).toLowerCase();
    const sanitizedPhone = sanitizeInput(customer_phone);
    const sanitizedStreet = sanitizeInput(street_address);
    const sanitizedCity = sanitizeInput(city);
    const sanitizedState = sanitizeInput(state);
    const sanitizedZip = sanitizeInput(zip);
    const sanitizedLandmark = sanitizeInput(landmark);
    const cleanOrderNumber = sanitizeInput(order_number);

    if (!/^[a-zA-Z\s]{3,50}$/.test(sanitizedName)) {
      return NextResponse.json({ message: 'Please enter a valid full name.' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
      return NextResponse.json({ message: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (!/^[6-9][0-9]{9}$/.test(sanitizedPhone)) {
      return NextResponse.json({ message: 'Please enter a valid 10-digit mobile number.' }, { status: 400 });
    }

    if (sanitizedStreet.length < 5 || sanitizedStreet.length > 200) {
      return NextResponse.json({ message: 'Please enter a complete delivery address.' }, { status: 400 });
    }

    if (!/^[a-zA-Z\s]+$/.test(sanitizedCity)) {
      return NextResponse.json({ message: 'Please enter a valid city name.' }, { status: 400 });
    }

    if (!INDIAN_STATES.includes(sanitizedState)) {
      return NextResponse.json({ message: 'Please select a valid Indian state.' }, { status: 400 });
    }

    if (!/^[1-9][0-9]{5}$/.test(sanitizedZip)) {
      return NextResponse.json({ message: 'Please enter a valid 6-digit postal code.' }, { status: 400 });
    }

    if (sanitizedLandmark && sanitizedLandmark.length > 100) {
      return NextResponse.json({ message: 'Landmark cannot exceed 100 characters.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 3. Idempotency Check: Prevent duplicate order submission
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, order_number, payment_status, total_amount')
      .eq('order_number', cleanOrderNumber)
      .maybeSingle();

    if (existingOrder) {
      console.warn(`[Duplicate Order Attempt]: Order ${cleanOrderNumber} already exists in database.`);
      return NextResponse.json({
        message: `Order ${cleanOrderNumber} has already been registered.`,
        order: existingOrder
      }, { status: 409 });
    }

    // 4. Duplicate Payment Check: Prevent reusing an already captured/linked payment ID
    const cleanPaymentId = payment_id ? sanitizeInput(payment_id) : null;
    if (cleanPaymentId && cleanPaymentId !== 'PENDING') {
      const { data: duplicatePaymentOrder } = await supabase
        .from('orders')
        .select('id, order_number')
        .eq('razorpay_payment_id', cleanPaymentId)
        .maybeSingle();

      if (duplicatePaymentOrder) {
        console.error(`[Security Alert] Duplicate Payment ID detected: ${cleanPaymentId} already used for Order ${duplicatePaymentOrder.order_number}`);
        return NextResponse.json({
          message: 'This payment transaction has already been linked to an existing order.'
        }, { status: 409 });
      }
    }

    // 5. Authoritative Price, Stock, Coupon, and Shipping Calculation from Database
    const pricingResult = await validateAndCalculateOrderPrices({
      items,
      coupon_id,
      clientTotalAmount,
      supabaseClient: supabase
    });

    if (!pricingResult.success) {
      return NextResponse.json({
        message: pricingResult.message
      }, { status: pricingResult.statusCode || 400 });
    }

    const {
      authoritativeSubtotal,
      authoritativeDiscount,
      appliedCouponId,
      authoritativeShipping,
      authoritativeTotal,
      authoritativeItems
    } = pricingResult;

    // Compose final clean address string for storage
    const shipping_address = `${sanitizedStreet}, ${sanitizedLandmark ? sanitizedLandmark + ', ' : ''}${sanitizedCity}, ${sanitizedState} - ${sanitizedZip}, India`;
    const billing_address = shipping_address;

    // Get authenticated customer session
    const customer = await getSessionCustomer();
    let user_id = customer ? customer.id : null;

    if (customer) {
      const { data: existingAddrs } = await supabase
        .from('user_addresses')
        .select('id')
        .eq('user_id', customer.id);
        
      if (!existingAddrs || existingAddrs.length === 0) {
        await supabase.from('user_addresses').insert({
          user_id: customer.id,
          name: sanitizedName,
          phone: sanitizedPhone,
          address: `${sanitizedStreet}${sanitizedLandmark ? ', ' + sanitizedLandmark : ''}`,
          city: sanitizedCity,
          state: sanitizedState,
          pincode: sanitizedZip,
          is_default: 1
        });
      }
    } else if (create_account) {
      let { data: existingUser } = await supabase.from('users').select('*').eq('email', sanitizedEmail).single();
      
      if (!existingUser) {
        const { data: newUser, error: createErr } = await supabase.from('users').insert({
          name: sanitizedName,
          email: sanitizedEmail,
          phone: sanitizedPhone,
          role: 'customer'
        }).select('*').single();
        
        if (!createErr) {
          existingUser = newUser;
        }
      }

      if (existingUser) {
        user_id = existingUser.id;
        const { data: existingAddrs } = await supabase.from('user_addresses').select('id').eq('user_id', user_id);
        if (!existingAddrs || existingAddrs.length === 0) {
          await supabase.from('user_addresses').insert({
            user_id: user_id,
            name: sanitizedName,
            phone: sanitizedPhone,
            address: `${sanitizedStreet}${sanitizedLandmark ? ', ' + sanitizedLandmark : ''}`,
            city: sanitizedCity,
            state: sanitizedState,
            pincode: sanitizedZip,
            is_default: 1
          });
        }
      }
    }

    // 10. Determine payment & order status based on payment method
    const isUpiQr = String(payment_method || '').toUpperCase() === 'UPI_QR';
    const sanitizedUtr = sanitizeInput(utr || '');

    if (isUpiQr && (!sanitizedUtr || sanitizedUtr.length < 4)) {
      return NextResponse.json({
        message: 'Please enter a valid Transaction ID / UTR number for your UPI payment.'
      }, { status: 400 });
    }

    let finalPaymentStatus = payment_status || 'Pending';
    let finalOrderStatus = 'Pending';
    let finalNotes = notes ? sanitizeInput(notes) : '';

    if (isUpiQr) {
      finalPaymentStatus = 'Pending Verification';
      finalOrderStatus = 'Payment Verification Pending';
      finalNotes = `Direct UPI QR | UTR: ${sanitizedUtr}${finalNotes ? ' | ' + finalNotes : ''}`;
    } else if (cleanPaymentId) {
      finalNotes = `Payment Gateway Transaction ID: ${cleanPaymentId}${finalNotes ? ' | ' + finalNotes : ''}`;
    }

    // 11. Insert Authoritative Order Record
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_number: cleanOrderNumber,
        user_id,
        customer_name: sanitizedName,
        customer_email: sanitizedEmail,
        customer_phone: sanitizedPhone,
        shipping_address,
        billing_address,
        coupon_id: appliedCouponId,
        discount_amount: authoritativeDiscount,
        shipping_charge: authoritativeShipping,
        subtotal: authoritativeSubtotal,
        total_amount: authoritativeTotal,
        payment_method: isUpiQr ? 'UPI_QR' : payment_method,
        payment_status: finalPaymentStatus,
        order_status: finalOrderStatus,
        razorpay_payment_id: cleanPaymentId || null,
        notes: finalNotes
      })
      .select('*')
      .single();

    if (orderErr || !order) {
      console.error('Order Insert Error:', orderErr);
      return NextResponse.json({ message: 'Failed to create order record.' }, { status: 500 });
    }

    // 12. Insert Order Items & Atomically Adjust Stock
    for (const item of authoritativeItems) {
      const { error: itemErr } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.product_name,
          price: item.price,
          quantity: item.quantity,
          total_price: item.total_price
        });

      if (itemErr) {
        console.error('Order Item Insert Error:', itemErr);
      }

      // Atomic inventory deduction
      const { data: prod } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', item.product_id)
        .single();
        
      const nextStock = Math.max(0, (prod?.stock_quantity ?? 0) - item.quantity);

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

        sendAdminLowStockEmail({
          productName: item.product_name,
          stockQuantity: nextStock
        }).catch(e => console.error('Low Stock Admin Email Error:', e));
      }
    }

    // 13. Update coupon usage count if coupon was applied
    if (appliedCouponId) {
      const { data: c } = await supabase.from('coupons').select('times_used').eq('id', appliedCouponId).single();
      if (c) {
        await supabase
          .from('coupons')
          .update({ times_used: (c.times_used || 0) + 1 })
          .eq('id', appliedCouponId);
      }
    }

    // 14. Create admin notification
    await supabase
      .from('notifications')
      .insert({
        message: `🎉 New Order Registered: Order ${cleanOrderNumber} placed by ${sanitizedName} for ${formatPrice(authoritativeTotal)}.`,
        is_read: 0,
        type: 'success',
        link: `/admin/orders`
      });

    // 15. Async Admin Email & WhatsApp Notifications
    sendAdminNewOrderEmail(order, authoritativeItems).catch(e => console.error('Admin New Order Email Error:', e));

    try {
      sendAdminOrderNotification(order, authoritativeItems, settingsMap).catch(e => console.error('WhatsApp Error:', e));
    } catch (e) {
      console.error('Failed to prepare WhatsApp notification', e);
    }

    return NextResponse.json({ success: true, order });
  } catch (err) {
    console.error('Order Process Error:', err);
    return NextResponse.json({ message: 'Internal Server Error while completing check-out.' }, { status: 500 });
  }
}
