'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { revalidateTag } from 'next/cache';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import { slugify } from '@/lib/utils';

const JWT_SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'anant_arts_divine_key_999');

// Helper to secure sessions with JWT cookies
async function setSessionCookie(user) {
  const token = await new jose.SignJWT({ id: user.id, email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(JWT_SECRET_KEY);

  const cookieStore = await cookies();
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

// Helper to verify user permissions for server-side mutations
async function checkAuthRole(allowedRoles = ['admin', 'super_admin']) {
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
export async function adminLogin(email, password) {
  try {
    const supabase = createAdminClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .in('role', ['admin', 'super_admin', 'manager', 'content_editor'])
      .single();

    if (error || !user) {
      return { success: false, message: 'Invalid admin credentials.' };
    }

    const match = bcrypt.compareSync(password, user.password_hash);
    if (!match) {
      return { success: false, message: 'Invalid admin credentials.' };
    }

    await setSessionCookie(user);
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
 * trackOrderAction — Securely looks up an order by ID + phone number
 * Replaces direct client-side Supabase query in order-tracking page.
 * @param {string} orderId - Customer's order ID
 * @param {string} phone - Customer's phone number for verification
 */
export async function trackOrderAction(orderId, phone) {
  try {
    if (!orderId || !phone) {
      return { success: false, message: 'Order ID and phone number are required.' };
    }

    const supabase = createAdminClient();
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id, status, total_amount, payment_status, payment_method,
        tracking_number, shipping_carrier, notes, created_at,
        shipping_name, shipping_address, shipping_city, shipping_state, shipping_pincode,
        order_items (
          quantity, price_at_purchase,
          products ( name, images:product_images(image_path) )
        )
      `)
      .eq('id', orderId)
      .eq('shipping_phone', phone.replace(/\s+/g, ''))
      .single();

    if (error || !order) {
      return { success: false, message: 'Order not found. Please check your Order ID and phone number.' };
    }

    return { success: true, order };
  } catch (err) {
    console.error('[trackOrderAction] Error:', err.message);
    return { success: false, message: 'An error occurred while tracking your order. Please try again.' };
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
    const { error } = await supabase.from('b2b_enquiries').insert({
      name,
      email,
      phone,
      company,
      quantity,
      product_interest,
      message
    });

    if (error) throw error;

    return { success: true, message: 'Thank you! Your bulk/corporate enquiry has been received. Our team will contact you in 24 hours.' };
  } catch (err) {
    console.error('[submitB2bEnquiry] Error:', err.message);
    return { success: false, message: 'Could not submit your enquiry. Please try again or contact us on WhatsApp.' };
  }
}
