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

// 1. Admin Authentication Actions
export async function adminLogin(email, password) {
  try {
    const supabase = createAdminClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('role', 'admin')
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
    const supabase = createAdminClient();
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;

    revalidateTag('products');
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function duplicateProduct(id) {
  try {
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
        seo_description: prod.seo_description
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

    revalidateTag('products');
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function addOrUpdateProduct(formData) {
  try {
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
          short_description
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
          short_description
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

    revalidateTag('categories');
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function deleteCategory(id) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;

    revalidateTag('categories');
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// 4. Coupon Management Actions
export async function addOrUpdateCoupon(couponData) {
  try {
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

    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function deleteCoupon(id) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// 5. Website Content / Settings Updates
export async function updateWebsiteSettings(settingsObj) {
  try {
    const supabase = createAdminClient();
    
    for (const [key, value] of Object.entries(settingsObj)) {
      const { error } = await supabase
        .from('website_settings')
        .upsert({ key, value });
      if (error) throw error;
    }

    revalidateTag('settings');
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// 6. Order Status Updates
export async function updateOrderStatus(orderId, status, trackingNumber = '') {
  try {
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
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// 7. Blog CRUD Actions
export async function addOrUpdateBlog(formData) {
  try {
    const supabase = createAdminClient();
    const id = formData.get('id');
    const title = formData.get('title');
    const content = formData.get('content');
    const short_desc = formData.get('short_desc');
    const is_published = formData.get('is_published') === '1' ? 1 : 0;
    const blogSlug = slugify(title);

    const imageFile = formData.get('featured_image');
    let imageUrl = formData.get('existing_image');
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadImageToSupabase(imageFile);
    }

    if (id) {
      const { error } = await supabase
        .from('blogs')
        .update({ title, slug: blogSlug, content, short_desc, featured_image: imageUrl, is_published, publish_date: new Date() })
        .eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('blogs')
        .insert({ title, slug: blogSlug, content, short_desc, featured_image: imageUrl, is_published, publish_date: new Date() });
      if (error) throw error;
    }

    revalidateTag('blogs');
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

export async function deleteBlog(id) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('blogs').delete().eq('id', id);
    if (error) throw error;

    revalidateTag('blogs');
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

// 8. Bulk CSV Import
export async function bulkImportProducts(productsList) {
  try {
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
