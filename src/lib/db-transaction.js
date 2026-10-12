import { Pool } from 'pg';
import { createAdminClient } from '@/lib/supabase/admin';

let pool = null;

const isProdDeployment = process.env.VERCEL_ENV
  ? process.env.VERCEL_ENV === 'production'
  : process.env.NODE_ENV === 'production';

// Only initialize direct pg Pool in Production when DATABASE_URL is configured
// Non-production (Preview/Dev) strictly uses Supabase admin client fallback to maintain staging isolation
if (!pool && isProdDeployment && process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  } catch (err) {
    console.error('[db-transaction] Failed to initialize pg Pool:', err.message);
  }
}

/**
 * Creates a fallback client backed by Supabase Admin Client
 * when direct DATABASE_URL is not configured in the environment.
 */
function createSupabaseClientFallback() {
  const supabase = createAdminClient();

  return {
    query: async (sql, params = []) => {
      const trimmed = sql.trim();

      // 1. SELECT product_id, quantity FROM order_items WHERE order_id = $1
      if (/^SELECT\s+product_id,\s*quantity\s+FROM\s+order_items\s+WHERE\s+order_id\s*=\s*\$1/i.test(trimmed)) {
        const { data, error } = await supabase
          .from('order_items')
          .select('product_id, quantity')
          .eq('order_id', params[0]);
        if (error) throw error;
        return { rows: data || [], rowCount: data ? data.length : 0 };
      }

      // 2. UPDATE orders SET payment_status = 'Captured' ... RETURNING id
      if (/^UPDATE\s+orders\s+SET/i.test(trimmed)) {
        if (trimmed.includes("payment_status != 'Captured'")) {
          // Verify payment or webhook capture
          const isVerifyRoute = params.length >= 4;
          const paymentId = params[0];
          const capturedAt = isVerifyRoute ? params[2] : params[1];
          const orderId = isVerifyRoute ? params[3] : params[2];
          const signature = isVerifyRoute ? params[1] : null;

          const updatePayload = {
            payment_status: 'Captured',
            order_status: 'Processing',
            razorpay_payment_id: paymentId,
            captured_at: capturedAt
          };
          if (signature) {
            updatePayload.razorpay_signature = signature;
          }

          const { data, error } = await supabase
            .from('orders')
            .update(updatePayload)
            .eq('id', orderId)
            .neq('payment_status', 'Captured')
            .select('id');

          if (error) throw error;
          return { rows: data || [], rowCount: data ? data.length : 0 };
        } else {
          // Generic update
          const { data, error } = await supabase
            .from('orders')
            .update({
              payment_status: 'Captured',
              order_status: 'Processing',
              razorpay_payment_id: params[0],
              captured_at: params[1]
            })
            .eq('id', params[2])
            .select('id');
          if (error) throw error;
          return { rows: data || [], rowCount: data ? data.length : 0 };
        }
      }

      // 3. UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - $1) WHERE id = $2
      if (/^UPDATE\s+products\s+SET\s+stock_quantity/i.test(trimmed)) {
        const qtyToDeduct = params[0];
        const productId = params[1];

        const { data: prod, error: fetchErr } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', productId)
          .single();

        if (fetchErr) throw fetchErr;
        const newStock = Math.max(0, (prod.stock_quantity || 0) - qtyToDeduct);

        const { error: updateErr } = await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', productId);

        if (updateErr) throw updateErr;
        return { rows: [{ stock_quantity: newStock }], rowCount: 1 };
      }

      // 4. DELETE FROM inventory_locks WHERE order_number = $1
      if (/^DELETE\s+FROM\s+inventory_locks\s+WHERE\s+order_number\s*=\s*\$1/i.test(trimmed)) {
        const { error } = await supabase
          .from('inventory_locks')
          .delete()
          .eq('order_number', params[0]);
        if (error) throw error;
        return { rows: [], rowCount: 1 };
      }

      // 5. INSERT INTO orders ... RETURNING id
      if (/^INSERT\s+INTO\s+orders/i.test(trimmed)) {
        const orderData = {
          order_number: params[0],
          user_id: params[1],
          customer_name: params[2],
          customer_email: params[3],
          customer_phone: params[4],
          shipping_address: params[5],
          billing_address: params[6],
          coupon_id: params[7],
          discount_amount: params[8],
          shipping_charge: params[9],
          subtotal: params[10],
          total_amount: params[11],
          payment_method: params[12],
          payment_status: params[13],
          order_status: params[14],
          razorpay_order_id: params[15],
          created_at: params[16],
          notes: params[17]
        };

        const { data, error } = await supabase
          .from('orders')
          .insert(orderData)
          .select('id')
          .single();

        if (error) throw error;
        return { rows: [data], rowCount: 1 };
      }

      // 6. INSERT INTO order_items
      if (/^INSERT\s+INTO\s+order_items/i.test(trimmed)) {
        const itemData = {
          order_id: params[0],
          product_id: params[1],
          product_name: params[2],
          price: params[3],
          quantity: params[4],
          total_price: params[5]
        };

        const { data, error } = await supabase
          .from('order_items')
          .insert(itemData)
          .select('id');

        if (error) throw error;
        return { rows: data || [], rowCount: 1 };
      }

      // 7. INSERT INTO inventory_locks
      if (/^INSERT\s+INTO\s+inventory_locks/i.test(trimmed)) {
        const lockData = {
          order_number: params[0],
          product_id: params[1],
          quantity: params[2],
          expires_at: params[3]
        };

        const { data, error } = await supabase
          .from('inventory_locks')
          .insert(lockData)
          .select('id');

        if (error) throw error;
        return { rows: data || [], rowCount: 1 };
      }

      // Unmatched queries: log warning
      console.warn('[db-transaction fallback] Unhandled SQL query:', trimmed);
      return { rows: [], rowCount: 0 };
    },
    release: () => {}
  };
}

export async function getClient() {
  if (pool) {
    return await pool.connect();
  }
  return createSupabaseClientFallback();
}

/**
 * Executes a callback within a database transaction or managed fallback.
 * Uses PostgreSQL transaction if DATABASE_URL is configured,
 * otherwise executes via Supabase Admin Client.
 * @param {Function} callback - Async function that receives the client
 */
export async function withTransaction(callback) {
  if (pool) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Fallback mode using Supabase
  const client = createSupabaseClientFallback();
  return await callback(client);
}
