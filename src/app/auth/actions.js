'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import { sendEmail } from '@/lib/email';
// import { sendWhatsAppMessage } from '@/lib/whatsapp'; // Assuming we had a direct text method, but let's just log it or send via email for now to guarantee delivery in dev.

const JWT_SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'anant_arts_divine_key_999');

// Helper to secure sessions with JWT cookies
export async function setCustomerSessionCookie(user) {
  const maxAge = 60 * 60 * 24 * 30; // 30 days

  const token = await new jose.SignJWT({ id: user.id, email: user.email, phone: user.phone, name: user.name, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(JWT_SECRET_KEY);

  const cookieStore = await cookies();
  cookieStore.set('customer_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge,
    path: '/',
  });
}

export async function customerLogout() {
  const cookieStore = await cookies();
  cookieStore.delete('customer_token');
  return { success: true };
}

export async function sendOtp(identifier) {
  try {
    if (!identifier) return { success: false, message: 'Phone or Email is required.' };
    
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 mins

    const supabase = createAdminClient();
    
    // Save to DB
    const { error } = await supabase.from('otps').insert({
      identifier: identifier.toLowerCase().trim(),
      otp,
      expires_at: expiresAt
    });

    if (error) throw error;

    console.log("OTP:", otp);

    // Determine if it's an email or phone
    const isEmail = identifier.includes('@');
    if (isEmail) {
      await sendEmail({
        to: identifier,
        subject: 'Your Anant Arts Login OTP',
        html: `<p>Your One Time Password (OTP) to login is: <strong style="font-size:24px;">${otp}</strong></p><p>This OTP is valid for 5 minutes.</p>`,
        text: `Your OTP is ${otp}`
      });
    } else {
      // In a real app, integrate Twilio/Fast2SMS here.
      console.log(`[DEV ONLY] SMS OTP to ${identifier}: ${otp}`);
    }

    return { success: true, message: 'OTP sent successfully.' };
  } catch (err) {
    console.error('sendOtp error:', err);
    return { success: false, message: 'Failed to send OTP. Please try again.' };
  }
}

export async function verifyOtp(identifier, otp, userName = 'Valued Customer') {
  try {
    const ident = identifier.toLowerCase().trim();
    const supabase = createAdminClient();
    
    // Check if OTP is valid (ignore expiration in DB query to handle timezone quirks)
    const { data: validOtp, error: otpError } = await supabase
      .from('otps')
      .select('*')
      .eq('identifier', ident)
      .eq('otp', otp.trim())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpError || !validOtp) {
      return { success: false, message: 'Invalid OTP.' };
    }

    // Check expiration in JavaScript
    // Ensure the timestamp is parsed as UTC to match how we inserted it
    const dbExpiresAt = validOtp.expires_at.endsWith('Z') ? validOtp.expires_at : validOtp.expires_at + 'Z';
    if (new Date(dbExpiresAt).getTime() < Date.now()) {
      return { success: false, message: 'OTP has expired. Please request a new one.' };
    }

    const isEmail = ident.includes('@');
    const lookupColumn = isEmail ? 'email' : 'phone';

    // Check if user exists
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq(lookupColumn, ident)
      .single();

    if (!user) {
      // Create new user automatically
      const insertData = {
        name: userName,
        role: 'customer'
      };
      
      if (isEmail) {
        insertData.email = ident;
      } else {
        insertData.phone = ident;
      }

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert(insertData)
        .select('*')
        .single();
        
      if (createError) throw createError;
      user = newUser;
    }

    // Set session cookie
    await setCustomerSessionCookie(user);

    // Clean up used OTPs
    await supabase.from('otps').delete().eq('identifier', ident);

    return { success: true, message: 'Logged in successfully.' };
  } catch (err) {
    console.error('verifyOtp error:', err);
    return { success: false, message: 'Verification failed.' };
  }
}

export async function getSessionCustomer() {
  const cookieStore = await cookies();
  const token = cookieStore.get('customer_token')?.value;
  if (!token) return null;

  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET_KEY);
    return payload;
  } catch (err) {
    return null; // Invalid token
  }
}
