import { unstable_cache } from 'next/cache';
import { createClient as createServerClient } from './supabase/server';
import { createClient as createBrowserClient } from '@supabase/supabase-js';

// Fallback client for static/server components that might run outside a request context
function getSupabaseDirect() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}

// 1. Get Site Settings (Cached)
export const getSettings = unstable_cache(
  async () => {
    const supabase = getSupabaseDirect();
    const { data, error } = await supabase.from('website_settings').select('*');
    if (error) {
      console.error('Error fetching settings:', error);
      return {};
    }
    const settings = {};
    data.forEach(r => { settings[r.key] = r.value; });
    return settings;
  },
  ['website-settings'],
  { tags: ['settings'], revalidate: 3600 }
);

// 2. Get Active Banners (Cached)
export const getBanners = unstable_cache(
  async () => {
    const supabase = getSupabaseDirect();
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', 1)
      .order('sort_order', { ascending: true });
    if (error) {
      console.error('Error fetching banners:', error);
      return [];
    }
    return data;
  },
  ['banners-list'],
  { tags: ['banners'], revalidate: 3600 }
);

// 3. Get Active Categories (Cached)
export const getCategories = unstable_cache(
  async () => {
    const supabase = getSupabaseDirect();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_hidden', 0)
      .order('sort_order', { ascending: true });
    if (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
    return data;
  },
  ['categories-list'],
  { tags: ['categories'], revalidate: 3600 }
);

// 4. Get Testimonials (Cached)
export const getTestimonials = unstable_cache(
  async () => {
    const supabase = getSupabaseDirect();
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('is_approved', 1)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching testimonials:', error);
      return [];
    }
    return data;
  },
  ['testimonials-list'],
  { tags: ['testimonials'], revalidate: 3600 }
);

// 5. Get Blogs (Cached)
export const getBlogs = unstable_cache(
  async (onlyPublished = true) => {
    const supabase = getSupabaseDirect();
    let query = supabase.from('blogs').select('*').order('created_at', { ascending: false });
    if (onlyPublished) {
      query = query.eq('is_published', 1);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching blogs:', error);
      return [];
    }
    return data;
  },
  ['blogs-list'],
  { tags: ['blogs'], revalidate: 3600 }
);

// 6. Get Blog By Slug (Cached)
export const getBlogBySlug = unstable_cache(
  async (slug) => {
    const supabase = getSupabaseDirect();
    const { data, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', 1)
      .single();
    if (error) {
      console.error(`Error fetching blog by slug ${slug}:`, error);
      return null;
    }
    return data;
  },
  ['blog-detail'],
  { tags: ['blogs'], revalidate: 3600 }
);

// 7. Get Product by Slug (Cached)
export const getProductBySlug = unstable_cache(
  async (slug) => {
    const supabase = getSupabaseDirect();
    
    // Fetch product
    const { data: product, error: prodError } = await supabase
      .from('products')
      .select('*, categories(id, name, slug)')
      .eq('slug', slug)
      .single();
      
    if (prodError) {
      console.error(`Error fetching product by slug ${slug}:`, prodError);
      return null;
    }
    
    // Fetch product images
    const { data: images, error: imgError } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', product.id)
      .order('is_primary', { ascending: false });
      
    if (imgError) {
      console.error('Error fetching product images:', imgError);
      product.images = [];
    } else {
      product.images = images;
    }
    
    return product;
  },
  ['product-detail'],
  { tags: ['products'], revalidate: 3600 }
);

// 8. Get Products List (Filtered & Sorted)
// Note: We don't cache the entire filtered lists globally using unstable_cache 
// because filters change frequently, or we can use custom cache keys if needed.
export async function getProducts(params = {}) {
  const supabase = getSupabaseDirect();
  const { category, search, sort, maxPrice, inStock, tag, all, limit } = params;
  
  let query = supabase
    .from('products')
    .select(`
      *,
      categories(name, slug),
      product_images(image_path, is_primary)
    `);

  if (!all) {
    query = query.eq('is_published', 1);
  }

  if (category) {
    query = query.eq('categories.slug', category);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (maxPrice) {
    // Standard logic in application layer to filter by maxPrice, 
    // but in PostgreSQL we can use a gte/lte check.
    query = query.lte('price', parseFloat(maxPrice));
  }

  if (inStock === '1') {
    query = query.gt('stock_quantity', 0);
  }

  if (tag) {
    query = query.like('tags', `%${tag}%`);
  }

  // Sorting
  if (sort === 'price-low') {
    query = query.order('price', { ascending: true });
  } else if (sort === 'price-high') {
    query = query.order('price', { ascending: false });
  } else if (sort === 'latest') {
    query = query.order('created_at', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  // Process data to structure image_path nicely
  const formattedProducts = data.map(product => {
    // If we filtered category in nested join, let's filter out products that don't match Category join
    if (category && (!product.categories || product.categories.slug !== category)) {
      return null;
    }
    
    const primaryImg = product.product_images?.find(img => img.is_primary === 1) || product.product_images?.[0];
    return {
      ...product,
      category_name: product.categories?.name || '',
      category_slug: product.categories?.slug || '',
      image_path: primaryImg?.image_path || '/images/placeholder.jpg'
    };
  }).filter(Boolean);

  return formattedProducts;
}

// 9. Get Related Products (Cached)
export const getRelatedProducts = unstable_cache(
  async (productId, categoryId) => {
    const supabase = getSupabaseDirect();
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(image_path, is_primary)')
      .eq('category_id', categoryId)
      .neq('id', productId)
      .eq('is_published', 1)
      .limit(4);
      
    if (error) {
      console.error('Error fetching related products:', error);
      return [];
    }
    
    return data.map(p => {
      const primaryImg = p.product_images?.find(img => img.is_primary === 1) || p.product_images?.[0];
      return {
        ...p,
        image_path: primaryImg?.image_path || '/images/placeholder.jpg'
      };
    });
  },
  ['product-related'],
  { tags: ['products'], revalidate: 3600 }
);
