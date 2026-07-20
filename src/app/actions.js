'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidateTag, revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import { slugify } from '@/lib/utils';
import { sendEmail } from '@/lib/email';
import { sendAdminB2bNotification } from '@/lib/whatsapp';


const JWT_SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'anant_arts_divine_key_999');

// Helper to secure sessions with JWT cookies
async function setSessionCookie(user, rememberMe = false) {
  const expiry = rememberMe ? '30d' : '24h';
  const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // 30 days or 24 hours

  const token = await new jose.SignJWT({ id: user.id, email: user.email, name: user.email.split('@')[0], role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expiry)
    .sign(JWT_SECRET_KEY);

  const cookieStore = await cookies();
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge,
    path: '/',
  });
}

// Helper to verify user permissions for server-side mutations
export async function checkAuthRole(allowedRoles = ['admin', 'super_admin']) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) {
    throw new Error('Unauthenticated admin session.');
  }

  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET_KEY);
    if (!allowedRoles.includes(payload.role)) {
      throw new Error(`Unauthorized role: ${payload.role}`);
    }
    return payload;
  } catch (err) {
    throw new Error('Invalid or expired admin session.');
  }
}

// Log audit events securely in the database
async function logAudit(adminEmail, action, details) {
  try {
    const supabase = createAdminClient();
    await supabase.from('audit_logs').insert({
      admin_email: adminEmail,
      action,
      details: typeof details === 'object' ? JSON.stringify(details) : details
    });
  } catch (err) {
    console.error('Audit logging failed:', err);
  }
}

// 1. Admin Authentication Actions
export async function adminLogin(email, password, rememberMe = false) {
  try {
    const supabase = createAdminClient();
    const { data: user, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return { success: false, message: 'Invalid admin credentials.' };
    }

    const match = bcrypt.compareSync(password, user.password_hash);
    if (!match) {
      return { success: false, message: 'Invalid admin credentials.' };
    }

    await setSessionCookie(user, rememberMe);
    return { success: true };
  } catch (err) {
    console.error('Login action error:', err);
    return { success: false, message: 'Authentication process failed.' };
  }
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete('token');
  return { success: true };
}

// Helper: Upload file to Supabase storage
async function uploadImageToSupabase(file) {
  if (!file || typeof file === 'string' || file.size === 0) return null;
  
  const supabase = createAdminClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `uploads/${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  // Make sure the bucket exists
  await supabase.storage.createBucket('uploads', { public: true }).catch(() => {});

  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: true
    });

  if (error) {
    console.error('Upload error detail:', error);
    throw new Error('Failed to upload image to Supabase Storage.');
  }

  const { data: publicUrlData } = supabase.storage
    .from('uploads')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

// 2. Product Management Actions
export async function deleteProduct(id) {
  try {
    const admin = await checkAuthRole(['super_admin', 'admin', 'manager']);
    const supabase = createAdminClient();
    
    const { data: prod } = await supabase.from('products').select('name, sku').eq('id', id).single();
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;

    await logAudit(admin.email, 'DELETE_PRODUCT', { id, name: prod?.name, sku: prod?.sku });
    revalidateTag('products');
    revalidatePath('/shop');
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function duplicateProduct(id) {
  try {
    const admin = await checkAuthRole(['super_admin', 'admin', 'manager']);
    const supabase = createAdminClient();
    
    // Get product details
    const { data: prod, error: prodErr } = await supabase.from('products').select('*').eq('id', id).single();
    if (prodErr) throw prodErr;

    // Get product images
    const { data: images } = await supabase.from('product_images').select('*').eq('product_id', id);

    // Duplicate product fields
    const duplicateSlug = `${prod.slug}-copy-${Math.floor(Math.random() * 1000)}`;
    const { data: newProd, error: newProdErr } = await supabase
      .from('products')
      .insert({
        name: `${prod.name} (Copy)`,
        slug: duplicateSlug,
        description: prod.description,
        category_id: prod.category_id,
        price: prod.price,
        discount_price: prod.discount_price,
        sku: `${prod.sku}-COPY-${Math.floor(Math.random() * 100)}`,
        material: prod.material,
        dimensions: prod.dimensions,
        weight: prod.weight,
        stock_quantity: prod.stock_quantity,
        is_published: 0, // start draft
        tags: prod.tags,
        short_description: prod.short_description,
        deity_category: prod.deity_category,
        is_bestseller: prod.is_bestseller,
        is_new_arrival: prod.is_new_arrival,
        is_featured: prod.is_featured,
        video_url: prod.video_url,
        seo_title: prod.seo_title,
        seo_description: prod.seo_description,
        finish_type: prod.finish_type,
        customization_option: prod.customization_option,
        bulk_pricing: prod.bulk_pricing,
        variants: prod.variants,
        related_products: prod.related_products
      })
      .select('*')
      .single();

    if (newProdErr) throw newProdErr;

    // Copy images mapping
    if (images && images.length > 0) {
      const imagesToInsert = images.map(img => ({
        product_id: newProd.id,
        image_path: img.image_path,
        is_primary: img.is_primary
      }));
      await supabase.from('product_images').insert(imagesToInsert);
    }

    await logAudit(admin.email, 'DUPLICATE_PRODUCT', { originalId: id, newId: newProd.id, name: prod.name });
    revalidateTag('products');
    revalidatePath('/shop');
    revalidatePath('/');
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function addOrUpdateProduct(formData) {
  try {
    const admin = await checkAuthRole(['super_admin', 'admin', 'manager', 'content_editor']);
    const supabase = createAdminClient();
    const id = formData.get('id');
    const name = formData.get('name');
    const description = formData.get('description');
    const category_id = formData.get('category_id') ? parseInt(formData.get('category_id')) : null;
    const price = parseFloat(formData.get('price'));
    const discount_price = formData.get('discount_price') ? parseFloat(formData.get('discount_price')) : null;
    const sku = formData.get('sku');
    const material = formData.get('material');
    const dimensions = formData.get('dimensions');
    const weight = formData.get('weight') ? parseFloat(formData.get('weight')) : null;
    const stock_quantity = parseInt(formData.get('stock_quantity') || 0);
    const is_published = formData.get('is_published') === '1' ? 1 : 0;
    const short_description = formData.get('short_description');
    const tagsArray = formData.get('tags') ? formData.get('tags').split(',').map(t => t.trim()) : [];
    
    // Extra options
    const is_bestseller = formData.get('is_bestseller') === '1' ? 1 : 0;
    const is_new_arrival = formData.get('is_new_arrival') === '1' ? 1 : 0;
    const is_featured = formData.get('is_featured') === '1' ? 1 : 0;
    const video_url = formData.get('video_url') || null;
    const seo_title = formData.get('seo_title') || null;
    const seo_description = formData.get('seo_description') || null;

    // Rebranding fields
    const finish_type = formData.get('finish_type') || null;
    const customization_option = formData.get('customization_option') || null;
    const bulk_pricing = formData.get('bulk_pricing') || null;
    const variants = formData.get('variants') || null;
    const related_products = formData.get('related_products') || null;

    // Handle image file uploads
    const primaryImageFile = formData.get('primary_image');
    let primaryImageUrl = formData.get('existing_primary_image');
    if (primaryImageFile && primaryImageFile.size > 0) {
      primaryImageUrl = await uploadImageToSupabase(primaryImageFile);
    }

    const newSlug = slugify(name);

    let product;
    if (id) {
      // Update
      const { data, error } = await supabase
        .from('products')
        .update({
          name,
          slug: newSlug,
          description,
          category_id,
          price,
          discount_price,
          sku,
          material,
          dimensions,
          weight,
          stock_quantity,
          is_published,
          tags: JSON.stringify(tagsArray),
          short_description,
          is_bestseller,
          is_new_arrival,
          is_featured,
          video_url,
          seo_title,
          seo_description,
          finish_type,
          customization_option,
          bulk_pricing,
          variants,
          related_products
        })
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      product = data;
    } else {
      // Create
      const { data, error } = await supabase
        .from('products')
        .insert({
          name,
          slug: newSlug,
          description,
          category_id,
          price,
          discount_price,
          sku,
          material,
          dimensions,
          weight,
          stock_quantity,
          is_published,
          tags: JSON.stringify(tagsArray),
          short_description,
          is_bestseller,
          is_new_arrival,
          is_featured,
          video_url,
          seo_title,
          seo_description,
          finish_type,
          customization_option,
          bulk_pricing,
          variants,
          related_products
        })
        .select('*')
        .single();
      if (error) throw error;
      product = data;
    }

    // Process image paths into product_images
    if (primaryImageUrl) {
      // Update primary image mapping
      // First disable existing primary
      await supabase.from('product_images').update({ is_primary: 0 }).eq('product_id', product.id);
      
      const { error: imgError } = await supabase
        .from('product_images')
        .insert({
          product_id: product.id,
          image_path: primaryImageUrl,
          is_primary: 1
        });
      if (imgError) console.error(imgError);
    }

    // Handle additional file attachments
    const additionalFiles = formData.getAll('additional_images');
    for (const addFile of additionalFiles) {
      if (addFile && addFile.size > 0) {
        const extraUrl = await uploadImageToSupabase(addFile);
        if (extraUrl) {
          await supabase.from('product_images').insert({
            product_id: product.id,
            image_path: extraUrl,
            is_primary: 0
          });
        }
      }
    }

    await logAudit(admin.email, id ? 'UPDATE_PRODUCT' : 'CREATE_PRODUCT', { id: product.id, name, sku });
    revalidateTag('products');
    revalidatePath('/shop');
    revalidatePath('/');
    return { success: true, product };
  } catch (err) {
    console.error(err);
    return { success: false, message: err.message };
  }
}

// 3. Category Management Actions
export async function addOrUpdateCategory(formData) {
  try {
    const admin = await checkAuthRole(['super_admin', 'admin', 'manager', 'content_editor']);
    const supabase = createAdminClient();
    const id = formData.get('id');
    const name = formData.get('name');
    const sort_order = parseInt(formData.get('sort_order') || 0);
    const is_hidden = formData.get('is_hidden') === '1' ? 1 : 0;
    const categorySlug = slugify(name);

    const imageFile = formData.get('image');
    let imageUrl = formData.get('existing_image');
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadImageToSupabase(imageFile);
    }

    if (id) {
      const { error } = await supabase
        .from('categories')
        .update({ name, slug: categorySlug, image_path: imageUrl, sort_order, is_hidden })
        .eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('categories')
        .insert({ name, slug: categorySlug, image_path: imageUrl, sort_order, is_hidden });
      if (error) throw error;
    }

    await logAudit(admin.email, id ? 'UPDATE_CATEGORY' : 'CREATE_CATEGORY', { id, name });
    revalidateTag('categories');
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function deleteCategory(id) {
  try {
    const admin = await checkAuthRole(['super_admin', 'admin', 'manager']);
    const supabase = createAdminClient();
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;

    await logAudit(admin.email, 'DELETE_CATEGORY', { id });
    revalidateTag('categories');
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// 4. Coupon Management Actions
export async function addOrUpdateCoupon(couponData) {
  try {
    const admin = await checkAuthRole(['super_admin', 'admin']);
    const supabase = createAdminClient();
    const { id, code, discount_type, discount_value, min_order_amount, usage_limit, start_date, end_date, is_active } = couponData;

    if (id) {
      const { error } = await supabase
        .from('coupons')
        .update({ code, discount_type, discount_value, min_order_amount, usage_limit, start_date, end_date, is_active })
        .eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('coupons')
        .insert({ code, discount_type, discount_value, min_order_amount, usage_limit, start_date, end_date, is_active });
      if (error) throw error;
    }

    await logAudit(admin.email, id ? 'UPDATE_COUPON' : 'CREATE_COUPON', { code });
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function deleteCoupon(id) {
  try {
    const admin = await checkAuthRole(['super_admin', 'admin']);
    const supabase = createAdminClient();
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) throw error;
    await logAudit(admin.email, 'DELETE_COUPON', { id });
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// 5. Website Content / Settings Updates
export async function updateWebsiteSettings(settingsObj) {
  try {
    const admin = await checkAuthRole(['super_admin', 'admin']);
    const supabase = createAdminClient();
    
    for (const [key, value] of Object.entries(settingsObj)) {
      const { error } = await supabase
        .from('website_settings')
        .upsert({ key, value });
      if (error) throw error;
    }

    await logAudit(admin.email, 'UPDATE_SETTINGS', Object.keys(settingsObj));
    revalidateTag('settings');
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// 6. Order Status Updates
export async function updateOrderStatus(orderId, status, trackingNumber = '') {
  try {
    const admin = await checkAuthRole(['super_admin', 'admin', 'manager']);
    const supabase = createAdminClient();
    const updates = { order_status: status };
    if (trackingNumber) {
      updates.tracking_number = trackingNumber;
    }
    
    if (status === 'Delivered') {
      updates.payment_status = 'Paid';
    }

    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId);

    if (error) throw error;
    await logAudit(admin.email, 'UPDATE_ORDER_STATUS', { orderId, status, trackingNumber });
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// 7. Blog CRUD Actions
export async function addOrUpdateBlog(formData) {
  try {
    const admin = await checkAuthRole(['super_admin', 'admin', 'content_editor']);
    const supabase = createAdminClient();
    const id = formData.get('id');
    const title = formData.get('title');
    const content = formData.get('content');
    const short_desc = formData.get('short_desc');
    const is_published = formData.get('is_published') === '1' ? 1 : 0;
    const blogSlug = slugify(title);
    
    // Scheduled publish date and SEO options
    const publish_date = formData.get('publish_date') || new Date().toISOString();
    const seo_title = formData.get('seo_title') || null;
    const seo_description = formData.get('seo_description') || null;

    const imageFile = formData.get('featured_image');
    let imageUrl = formData.get('existing_image');
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadImageToSupabase(imageFile);
    }

    if (id) {
      const { error } = await supabase
        .from('blogs')
        .update({ title, slug: blogSlug, content, short_desc, featured_image: imageUrl, is_published, publish_date, seo_title, seo_description })
        .eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('blogs')
        .insert({ title, slug: blogSlug, content, short_desc, featured_image: imageUrl, is_published, publish_date, seo_title, seo_description });
      if (error) throw error;
    }

    await logAudit(admin.email, id ? 'UPDATE_BLOG' : 'CREATE_BLOG', { title, slug: blogSlug });
    revalidateTag('blogs');
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function deleteBlog(id) {
  try {
    const admin = await checkAuthRole(['super_admin', 'admin']);
    const supabase = createAdminClient();
    const { error } = await supabase.from('blogs').delete().eq('id', id);
    if (error) throw error;

    await logAudit(admin.email, 'DELETE_BLOG', { id });
    revalidateTag('blogs');
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// 8. Bulk CSV Import
export async function bulkImportProducts(productsList) {
  try {
    const admin = await checkAuthRole(['super_admin', 'admin', 'manager']);
    const supabase = createAdminClient();
    
    for (const prod of productsList) {
      if (!prod.name || !prod.price) continue;
      
      const prodSlug = slugify(prod.name);
      
      // Get category ID from slug
      let categoryId = null;
      if (prod.category_slug) {
        const { data: cat } = await supabase.from('categories').select('id').eq('slug', prod.category_slug).single();
        if (cat) categoryId = cat.id;
      }

      const { data: newProd, error } = await supabase
        .from('products')
        .insert({
          name: prod.name,
          slug: prodSlug,
          description: prod.description || '',
          category_id: categoryId,
          price: parseFloat(prod.price),
          discount_price: prod.discount_price ? parseFloat(prod.discount_price) : null,
          sku: prod.sku || `AA-CSV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          material: prod.material || '',
          dimensions: prod.dimensions || '',
          weight: prod.weight ? parseFloat(prod.weight) : null,
          stock_quantity: parseInt(prod.stock_quantity || 0),
          is_published: 1,
          tags: JSON.stringify(prod.tags ? prod.tags.split(',').map(t => t.trim()) : [])
        })
        .select('*')
        .single();

      if (error) {
        console.error(`CSV import failed for product ${prod.name}:`, error.message);
        continue;
      }

      // Add placeholder image mapping
      if (prod.image_url && newProd) {
        await supabase.from('product_images').insert({
          product_id: newProd.id,
          image_path: prod.image_url,
          is_primary: 1
        });
      }
    }

    await logAudit(admin.email, 'BULK_IMPORT_PRODUCTS', { count: productsList.length });
    revalidateTag('products');
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// 9. Consultation Actions
export async function submitConsultation(data) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('consultations')
      .insert({
        name: data.name,
        phone: data.phone,
        whatsapp: data.whatsapp || null,
        city: data.city || null,
        deity_interest: data.deity_interest || null,
        dimensions: data.dimensions || null,
        preferred_date: data.preferred_date || null,
        notes: data.notes || null
      });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Submit consultation error:', err);
    return { success: false, message: err.message };
  }
}

// 10. Flash Sales Actions
export async function addOrUpdateFlashSale(saleData) {
  try {
    const admin = await checkAuthRole(['super_admin', 'admin']);
    const supabase = createAdminClient();
    const { id, title, discount_percentage, start_date, end_date, is_active } = saleData;

    if (id) {
      const { error } = await supabase
        .from('flash_sales')
        .update({ title, discount_percentage, start_date, end_date, is_active })
        .eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('flash_sales')
        .insert({ title, discount_percentage, start_date, end_date, is_active });
      if (error) throw error;
    }

    await logAudit(admin.email, id ? 'UPDATE_FLASH_SALE' : 'CREATE_FLASH_SALE', { title });
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function deleteFlashSale(id) {
  try {
    const admin = await checkAuthRole(['super_admin', 'admin']);
    const supabase = createAdminClient();
    const { error } = await supabase.from('flash_sales').delete().eq('id', id);
    if (error) throw error;

    await logAudit(admin.email, 'DELETE_FLASH_SALE', { id });
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// ======================================================
// PUBLIC SERVER ACTIONS (no auth required)
// ======================================================

/**
 * trackOrderAction — Looks up an order by order_number (or id)
 * If user is authenticated, allows direct lookup for their own orders without phone requirement.
 * If guest, requires phone number verification matching customer_phone.
 * @param {string} orderId - Customer's order number or ID
 * @param {string} phone - Customer's phone number (optional if logged in)
 */
export async function trackOrderAction(orderId, phone) {
  try {
    const cleanId = (orderId || '').trim();
    const cleanPhone = (phone || '').replace(/\s+/g, '').trim();

    console.log('[trackOrderAction] Received -> Order ID:', cleanId, '| Phone:', cleanPhone);

    if (!cleanId) {
      return { success: false, message: 'Please enter an Order ID or Order Number.' };
    }

    const customer = await getSessionCustomer();
    console.log('[trackOrderAction] Customer Session:', customer ? `User ID: ${customer.id}, Email: ${customer.email}` : 'Guest');

    const supabase = createAdminClient();

    // Query order by order_number or numeric id
    let query = supabase
      .from('orders')
      .select(`
        id, user_id, order_number, customer_name, customer_email, customer_phone,
        shipping_address, billing_address, coupon_id, discount_amount, shipping_charge,
        subtotal, total_amount, payment_method, payment_status, order_status, notes,
        tracking_number, courier_name, estimated_delivery, created_at,
        order_items (
          id, product_id, product_name, price, quantity, total_price
        )
      `);

    const isNumeric = /^\d+$/.test(cleanId);
    if (isNumeric) {
      query = query.eq('id', parseInt(cleanId, 10));
    } else {
      query = query.eq('order_number', cleanId);
    }

    const { data: orders, error: orderErr } = await query;
    console.log('[trackOrderAction] Query result count:', orders ? orders.length : 0, 'Error:', orderErr);

    let matchedOrder = orders && orders.length > 0 ? orders[0] : null;

    // Fallback search if cleanId was typed with different case
    if (!matchedOrder && !isNumeric) {
      const { data: fallbackOrders } = await supabase
        .from('orders')
        .select(`
          id, user_id, order_number, customer_name, customer_email, customer_phone,
          shipping_address, billing_address, coupon_id, discount_amount, shipping_charge,
          subtotal, total_amount, payment_method, payment_status, order_status, notes,
          tracking_number, courier_name, estimated_delivery, created_at,
          order_items (
            id, product_id, product_name, price, quantity, total_price
          )
        `)
        .ilike('order_number', cleanId);
      if (fallbackOrders && fallbackOrders.length > 0) {
        matchedOrder = fallbackOrders[0];
      }
    }

    if (!matchedOrder) {
      return { 
        success: false, 
        message: `Order "${cleanId}" not found. Please double-check your Order ID.` 
      };
    }

    // Ownership & Verification Check
    if (customer) {
      console.log('[trackOrderAction] Authenticated user tracking order:', matchedOrder.order_number);
    } else {
      if (!cleanPhone) {
        return { success: false, message: 'Please enter your registered phone number for guest order verification.' };
      }
      const dbPhone = (matchedOrder.customer_phone || '').replace(/\s+/g, '');
      if (dbPhone !== cleanPhone && !dbPhone.endsWith(cleanPhone) && !cleanPhone.endsWith(dbPhone)) {
        return { success: false, message: 'Phone number does not match the record for this Order ID.' };
      }
    }

    // Fetch tracking events for timeline
    let trackingEvents = [];
    try {
      const { data: events } = await supabase
        .from('order_tracking_events')
        .select('*')
        .eq('order_id', matchedOrder.id)
        .order('timestamp', { ascending: true });
      if (events) trackingEvents = events;
    } catch (e) {
      console.warn('[trackOrderAction] Non-fatal tracking events fetch error:', e.message);
    }

    return { 
      success: true, 
      order: matchedOrder,
      trackingEvents
    };
  } catch (err) {
    console.error('[trackOrderAction] Critical Exception:', err);
    return { 
      success: false, 
      message: `Error tracking order: ${err.message || 'Unknown error'}` 
    };
  }
}

/**
 * addAdminOrderTrackingEventAction — Adds a tracking event and updates order status/courier info
 */
export async function addAdminOrderTrackingEventAction({
  orderId,
  status,
  courierName,
  trackingNumber,
  estimatedDelivery,
  title,
  description,
  location
}) {
  try {
    const admin = await checkAuthRole(['admin', 'super_admin']);
    if (!orderId || !status) {
      return { success: false, message: 'Order ID and status are required.' };
    }

    const supabase = createAdminClient();

    // 1. Fetch current order details
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return { success: false, message: 'Order not found.' };
    }

    // 2. Update orders table
    const updateData = { order_status: status };
    if (courierName !== undefined) updateData.courier_name = courierName;
    if (trackingNumber !== undefined) updateData.tracking_number = trackingNumber;
    if (estimatedDelivery !== undefined) updateData.estimated_delivery = estimatedDelivery;

    await supabase.from('orders').update(updateData).eq('id', orderId);

    // 3. Insert into order_tracking_events
    const eventTitle = title || `Order ${status}`;
    const eventDesc = description || `Status updated to ${status}.`;

    const { data: newEvent } = await supabase
      .from('order_tracking_events')
      .insert({
        order_id: orderId,
        status,
        title: eventTitle,
        description: eventDesc,
        location: location || 'Warehouse Hub',
        created_by_admin: admin.email || 'Admin'
      })
      .select('*')
      .single();

    // 4. Send email alert to customer if email is valid
    if (order.customer_email) {
      const emailSubject = `Order #${order.order_number} Update: ${eventTitle}`;
      const emailText = `Hello ${order.customer_name},\n\nYour order #${order.order_number} status has been updated to: ${status}.\n\nDetails: ${eventDesc}\n${estimatedDelivery ? `Expected Delivery: ${estimatedDelivery}\n` : ''}\nTrack your shipment live at: https://anantarts.in/order-tracking?order=${order.order_number}\n\nThank you for choosing Anant Arts!`;

      sendEmail({
        to: order.customer_email,
        subject: emailSubject,
        text: emailText,
        html: `<div style="font-family: sans-serif; padding: 20px; color: #333;"><p>Hello <strong>${order.customer_name}</strong>,</p><p>Your order <strong>#${order.order_number}</strong> status is now: <span style="color: #D4AF37; font-weight: bold;">${status}</span>.</p><p>${eventDesc}</p>${estimatedDelivery ? `<p><strong>Expected Delivery:</strong> ${estimatedDelivery}</p>` : ''}<p style="margin-top: 20px;"><a href="https://anantarts.in/order-tracking?order=${order.order_number}" style="background: #D4AF37; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Track Shipment Live</a></p></div>`
      }).catch(err => console.error('Email alert sending error:', err));
    }

    await logAudit(admin.email, 'UPDATE_ORDER_TRACKING', { orderId, status, title: eventTitle });

    return { success: true, message: 'Tracking status updated & event recorded successfully!', event: newEvent };
  } catch (err) {
    console.error('[addAdminOrderTrackingEventAction] Error:', err);
    return { success: false, message: err.message || 'Failed to update tracking.' };
  }
}

/**
 * getAdminOrderTrackingEventsAction — Fetches all tracking events for an order
 */
export async function getAdminOrderTrackingEventsAction(orderId) {
  try {
    const supabase = createAdminClient();
    const { data: events, error } = await supabase
      .from('order_tracking_events')
      .select('*')
      .eq('order_id', orderId)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return { success: true, events: events || [] };
  } catch (err) {
    console.error('[getAdminOrderTrackingEventsAction] Error:', err);
    return { success: false, events: [] };
  }
}

/**
 * submitContactInquiry — Saves a customer contact form submission
 * Replaces direct client-side Supabase call in the contact page.
 * @param {Object} formData - { name, email, phone, subject, message }
 */
export async function submitContactInquiry({ name, email, phone, subject, message }) {
  try {
    if (!name || !email || !message) {
      return { success: false, message: 'Name, email, and message are required.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: 'Please provide a valid email address.' };
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from('consultations').insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      service: subject?.trim() || 'General Inquiry',
      message: message.trim(),
      inquiry_type: 'contact',
      status: 'new',
    });

    if (error) throw error;

    return { success: true, message: 'Thank you for contacting us! We will get back to you within 24 hours.' };
  } catch (err) {
    console.error('[submitContactInquiry] Error:', err.message);
    return { success: false, message: 'Could not submit your inquiry. Please try again or WhatsApp us directly.' };
  }
}

/**
 * submitCorporateInquiry — Saves a corporate/bulk gift inquiry
 * Replaces direct client-side Supabase call in the corporate-gifts page.
 * @param {Object} formData - { name, email, phone, company, quantity, requirements }
 */
export async function submitCorporateInquiry({ name, email, phone, company, quantity, requirements }) {
  try {
    if (!name || !email) {
      return { success: false, message: 'Name and email are required.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: 'Please provide a valid email address.' };
    }

    const supabase = createAdminClient();
    const message = [
      company ? `Company: ${company}` : '',
      quantity ? `Quantity: ${quantity}` : '',
      requirements ? `Requirements: ${requirements}` : '',
    ].filter(Boolean).join('\n');

    const { error } = await supabase.from('consultations').insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      service: 'Corporate Gift Order',
      message,
      inquiry_type: 'corporate_gift',
      status: 'new',
    });

    if (error) throw error;

    return { success: true, message: 'Thank you for your corporate inquiry! Our team will contact you within 24 hours.' };
  } catch (err) {
    console.error('[submitCorporateInquiry] Error:', err.message);
    return { success: false, message: 'Could not submit your inquiry. Please try again or call us directly.' };
  }
}

export async function submitB2bEnquiry(prevState, formData) {
  try {
    const name = formData.get('name')?.trim();
    const email = formData.get('email')?.trim().toLowerCase();
    const phone = formData.get('phone')?.trim();
    const company = formData.get('company')?.trim() || null;
    const quantity = parseInt(formData.get('quantity') || 0);
    const product_interest = formData.get('product_interest')?.trim() || 'General';
    const message = formData.get('message')?.trim() || '';

    if (!name || !email || !phone || !quantity) {
      return { success: false, message: 'Please fill in all required fields.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    const phoneRegex = /^[6-9][0-9]{9}$/;
    if (!phoneRegex.test(phone)) {
      return { success: false, message: 'Please enter a valid 10-digit mobile number.' };
    }

    const supabase = createAdminClient();
    
    // Insert into database
    const { data: enquiry, error } = await supabase.from('b2b_enquiries').insert({
      name,
      email,
      phone,
      company,
      quantity,
      product_interest,
      message
    }).select('*').single();

    if (error) throw error;

    // Fetch site settings for notifications
    let settings = {};
    try {
      const { data: settingsData } = await supabase.from('website_settings').select('*');
      if (settingsData) {
        settingsData.forEach(r => { settings[r.key] = r.value; });
      }
    } catch (e) {
      console.error('[submitB2bEnquiry] Settings load failed:', e.message);
    }

    const adminEmail = settings.contact_email || 'anantarts39@gmail.com';
    const adminWhatsApp = settings.whatsapp_admin_number || '917275819354';

    // 1. Send WhatsApp Notification to Admin (using WhatsApp Cloud API)
    try {
      if (settings.whatsapp_notifications_enabled === '1') {
        // Run in background without awaiting to keep response fast
        sendAdminB2bNotification(enquiry, settings).catch(e => console.error('[submitB2bEnquiry] WhatsApp API error:', e.message));
      }
    } catch (e) {
      console.error('[submitB2bEnquiry] Failed to queue WhatsApp notification:', e.message);
    }

    // 2. Send Emails (Admin Notification and Client Confirmation)
    try {
      // Admin Notification Email
      const adminMailSubject = `💼 New B2B Enquiry: ${quantity}x ${product_interest} from ${name}`;
      const adminMailHtml = `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #d4af37; border-radius: 8px;">
          <h2 style="color: #800020; border-bottom: 2px solid #d4af37; padding-bottom: 10px; margin-top: 0;">New Bulk / B2B Enquiry</h2>
          <p>You have received a new business lead from the website B2B Enquiry Form:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr>
              <td style="padding: 8px; font-weight: bold; width: 150px; border-bottom: 1px solid #eee;">Full Name:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Business Email:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Phone Number:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="tel:${phone}">${phone}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Company Name:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${company || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Estimated Quantity:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${quantity} units</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #eee;">Product Interest:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${product_interest}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; vertical-align: top; border-bottom: 1px solid #eee;">Requirements:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; white-space: pre-wrap;">${message || 'No additional requirements provided.'}</td>
            </tr>
          </table>
          <p style="margin-top: 25px; font-size: 0.85em; color: #666; text-align: center;">
            This email was automatically generated by the Anant Arts server.
          </p>
        </div>
      `;
      const adminMailText = `New B2B Enquiry:\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nCompany: ${company || 'N/A'}\nQuantity: ${quantity}\nProduct Interest: ${product_interest}\nMessage: ${message}`;
      
      sendEmail({
        to: adminEmail,
        subject: adminMailSubject,
        html: adminMailHtml,
        text: adminMailText
      }).catch(e => console.error('[submitB2bEnquiry] Admin email error:', e.message));

      // Client Confirmation Email
      const clientMailSubject = `We have received your B2B Enquiry - Anant Arts`;
      const clientMailHtml = `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #d4af37; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #800020; margin: 0; font-size: 24px;">ANANT ARTS</h1>
            <p style="color: #d4af37; font-size: 14px; font-style: italic; margin: 4px 0 0 0;">Divine Art for Every Space</p>
          </div>
          <h3 style="color: #333; margin-top: 0;">Dear ${name},</h3>
          <p>Thank you for reaching out to Anant Arts with your B2B/Bulk order inquiry.</p>
          <p>Our sales team has received your request and is currently compiling the custom catalogs, pricing, and volume discount details tailored to your needs. A representative will contact you via email or phone within 24 hours.</p>
          
          <div style="background-color: #faf9f6; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 3px solid #d4af37;">
            <h4 style="margin: 0 0 8px 0; color: #800020;">Summary of Your Inquiry:</h4>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.6; font-size: 14px;">
              <li><strong>Product Category:</strong> ${product_interest}</li>
              <li><strong>Estimated Volume:</strong> ${quantity} units</li>
              <li><strong>Company:</strong> ${company || 'N/A'}</li>
            </ul>
          </div>
          
          <p>If you have any urgent changes or questions, please feel free to reply directly to this email or chat with us on WhatsApp.</p>
          <p style="margin-bottom: 0;">Warm regards,</p>
          <p style="font-weight: bold; color: #800020; margin-top: 4px;">Anant Arts Patron Support Team</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 11px; color: #999; text-align: center; margin: 0;">
            Jaipur Studio | Dombivli (Mumbai) | <a href="https://anantarts.in" style="color: #d4af37; text-decoration: none;">www.anantarts.in</a>
          </p>
        </div>
      `;
      const clientMailText = `Dear ${name},\n\nThank you for reaching out to Anant Arts. We have received your B2B Enquiry for ${quantity}x ${product_interest}. Our team will contact you within 24 hours.\n\nBest regards,\nAnant Arts Patron Support Team`;

      sendEmail({
        to: email,
        subject: clientMailSubject,
        html: clientMailHtml,
        text: clientMailText
      }).catch(e => console.error('[submitB2bEnquiry] Client email error:', e.message));

    } catch (e) {
      console.error('[submitB2bEnquiry] Failed to process email notifications:', e.message);
    }

    // 3. Generate WhatsApp redirect link for the user
    let toNum = adminWhatsApp.replace(/\D/g, '');
    if (toNum.length === 10) toNum = '91' + toNum;
    
    const waText = `Hi Anant Arts Team,\n\nI just submitted a B2B Enquiry. Here are my details:\n\n` +
      `👤 *Name:* ${name}\n` +
      `🏢 *Company:* ${company || 'N/A'}\n` +
      `📧 *Email:* ${email}\n` +
      `📞 *Phone:* ${phone}\n` +
      `🔢 *Quantity:* ${quantity}\n` +
      `🏷️ *Product Category:* ${product_interest}\n` +
      `📝 *Message:* ${message || 'None'}\n\n` +
      `Please contact me with a custom catalog and pricing.`;

    const whatsappRedirectUrl = `https://wa.me/${toNum}?text=${encodeURIComponent(waText)}`;

    return { 
      success: true, 
      message: 'Thank you! Your bulk/corporate enquiry has been received. Our team will contact you in 24 hours.',
      whatsappRedirectUrl
    };
  } catch (err) {
    console.error('[submitB2bEnquiry] Error:', err.message);
    return { success: false, message: 'Could not submit your enquiry. Please try again or contact us on WhatsApp.' };
  }
}

export async function updateSettings(settingsArray) {
  try {
    const adminSession = await checkAuthRole(['admin', 'super_admin']);
    const supabase = createAdminClient();
    for (const setting of settingsArray) {
      await supabase
        .from('website_settings')
        .upsert({ key: setting.key, value: setting.value }, { onConflict: 'key' });
    }
    await logAudit(adminSession.email, 'UPDATE_SETTINGS', 'Updated website settings.');
    revalidatePath('/admin');
    return { success: true };
  } catch (err) {
    console.error('updateSettings error:', err);
    return { success: false, message: 'Failed to update settings.' };
  }
}

export async function createAdminAction(email, password, role) {
  try {
    const caller = await checkAuthRole(['super_admin']);
    const supabase = createAdminClient();
    const password_hash = bcrypt.hashSync(password, 10);

    const { error } = await supabase.from('admins').insert({
      email,
      password_hash,
      role,
      is_active: true
    });
    if (error) throw error;

    await logAudit(caller.email, 'CREATE_ADMIN', { email, role });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function toggleAdminStatusAction(adminId, isActive) {
  try {
    const caller = await checkAuthRole(['super_admin']);
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('admins')
      .update({ is_active: isActive })
      .eq('id', adminId);
    if (error) throw error;

    await logAudit(caller.email, 'TOGGLE_ADMIN_STATUS', { adminId, isActive });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function deleteAdminAction(adminId) {
  try {
    const caller = await checkAuthRole(['super_admin']);
    const supabase = createAdminClient();

    const { error } = await supabase.from('admins').delete().eq('id', adminId);
    if (error) throw error;

    await logAudit(caller.email, 'DELETE_ADMIN', { adminId });
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function getAdminSessionAction() {
  try {
    const session = await checkAuthRole(['super_admin', 'admin', 'manager', 'content_editor']);
    return { success: true, user: session };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function getTrendingAndSuggestionsAction(searchQuery = '') {
  try {
    const supabase = createAdminClient();
    
    // Fetch trending products (published and limited to 6)
    const { data: trendingRaw } = await supabase
      .from('products')
      .select(`
        id, name, slug, price, discount_price, is_published,
        product_images(image_path, is_primary)
      `)
      .eq('is_published', 1)
      .limit(6);
      
    const trending = (trendingRaw || []).map(p => {
      const primaryImg = p.product_images?.find(img => img.is_primary === 1) || p.product_images?.[0];
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        discount_price: p.discount_price,
        image_path: primaryImg?.image_path || '/images/placeholder.jpg'
      };
    });

    let suggestions = [];
    if (searchQuery.trim().length >= 1) {
      const q = searchQuery.toLowerCase().trim();
      const { data: suggestionsRaw } = await supabase
        .from('products')
        .select(`
          id, name, slug, price, discount_price, is_published,
          product_images(image_path, is_primary)
        `)
        .eq('is_published', 1)
        .ilike('name', `%${q}%`)
        .limit(6);

      suggestions = (suggestionsRaw || []).map(p => {
        const primaryImg = p.product_images?.find(img => img.is_primary === 1) || p.product_images?.[0];
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          discount_price: p.discount_price,
          image_path: primaryImg?.image_path || '/images/placeholder.jpg'
        };
      });
    }

    return { success: true, trending, suggestions };
  } catch (err) {
    console.error('getTrendingAndSuggestionsAction error:', err);
    return { success: false, trending: [], suggestions: [] };
  }
}
