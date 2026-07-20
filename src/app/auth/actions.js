'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import * as jose from 'jose';
import { cookies } from 'next/headers';
import { sendEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';
// import { sendWhatsAppMessage } from '@/lib/whatsapp';

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
        subject: `Anant Arts Verification Code: ${otp}`,
        html: `
          <h2 style="color: #333333; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Verification Code</h2>
          <p style="margin: 0 0 24px 0; color: #555555; font-size: 14px; line-height: 1.5;">
            Use the verification code below to complete your login or registration on Anant Arts. This code is valid for 5 minutes.
          </p>
          <div style="background-color: #F9F9F9; border: 1px solid #EAEAEA; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #D4AF37;">${otp}</span>
          </div>
          <p style="margin: 0; color: #888888; font-size: 12px; line-height: 1.5;">
            If you did not request this code, you can safely ignore this email.
          </p>
        `,
        text: `Your Anant Arts verification code is: ${otp}. This code is valid for 5 minutes.`
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

// ==================== PASSWORD-BASED AUTH ====================

export async function registerCustomer(name, email, phone, password) {
  try {
    // Validation
    const cleanName = (name || '').trim();
    if (cleanName.length < 3 || cleanName.length > 50) {
      return { success: false, message: 'Name must be between 3 and 50 characters.' };
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    const cleanPhone = (phone || '').trim();
    if (cleanPhone && !/^[6-9][0-9]{9}$/.test(cleanPhone)) {
      return { success: false, message: 'Please enter a valid 10-digit mobile number.' };
    }

    if (!password || password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters.' };
    }

    const supabase = createAdminClient();

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();
    if (existingEmail) {
      return { success: false, message: 'An account with this email already exists. Please login instead.' };
    }

    // Check if phone already exists (if provided)
    if (cleanPhone) {
      const { data: existingPhone } = await supabase
        .from('users')
        .select('id')
        .eq('phone', cleanPhone)
        .maybeSingle();
      if (existingPhone) {
        return { success: false, message: 'An account with this phone number already exists. Please login instead.' };
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const insertData = {
      name: cleanName,
      email: cleanEmail,
      password_hash: passwordHash,
      role: 'customer',
    };
    if (cleanPhone) insertData.phone = cleanPhone;

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert(insertData)
      .select('*')
      .single();

    if (createError) {
      console.error('registerCustomer insert error:', createError);
      return { success: false, message: 'Failed to create account. Please try again.' };
    }

    // Set session cookie
    await setCustomerSessionCookie(newUser);

    return { success: true, message: 'Account created successfully!' };
  } catch (err) {
    console.error('registerCustomer error:', err);
    return { success: false, message: 'Something went wrong. Please try again.' };
  }
}

export async function loginCustomer(identifier, password) {
  try {
    if (!identifier || !password) {
      return { success: false, message: 'Please enter your email/phone and password.' };
    }

    const ident = identifier.trim().toLowerCase();
    const isEmail = ident.includes('@');
    const lookupColumn = isEmail ? 'email' : 'phone';

    const supabase = createAdminClient();

    // Look up user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq(lookupColumn, ident)
      .single();

    if (userError || !user) {
      return { success: false, message: 'No account found with this email/phone. Please register first.' };
    }

    // Check if user has a password set
    if (!user.password_hash) {
      return { success: false, message: 'This account was created via OTP. Please contact support or use the forgot password option to set a password.' };
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return { success: false, message: 'Incorrect password. Please try again.' };
    }

    // Set session cookie
    await setCustomerSessionCookie(user);

    return { success: true, message: 'Logged in successfully!' };
  } catch (err) {
    console.error('loginCustomer error:', err);
    return { success: false, message: 'Login failed. Please try again.' };
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

export async function updateCustomerProfile(newName, newPhone, newEmail) {
  try {
    const customer = await getSessionCustomer();
    if (!customer) return { success: false, message: 'Not authenticated.' };

    const cleanName = (newName || '').trim();
    if (cleanName.length < 3 || cleanName.length > 50) {
      return { success: false, message: 'Name must be between 3 and 50 characters.' };
    }

    const cleanPhone = (newPhone || '').trim();
    if (cleanPhone && !/^[6-9][0-9]{9}$/.test(cleanPhone)) {
      return { success: false, message: 'Please enter a valid 10-digit mobile number.' };
    }

    const cleanEmail = (newEmail || '').trim().toLowerCase();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, message: 'Please enter a valid email address.' };
    }

    const supabase = createAdminClient();

    // Verify uniqueness of phone if changed
    if (cleanPhone && cleanPhone !== (customer.phone || '')) {
      const { data: existingPhone } = await supabase
        .from('users')
        .select('id')
        .eq('phone', cleanPhone)
        .maybeSingle();
      if (existingPhone) {
        return { success: false, message: 'This phone number is already registered by another account.' };
      }
    }

    // Verify uniqueness of email if changed
    if (cleanEmail && cleanEmail !== (customer.email || '')) {
      const { data: existingEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();
      if (existingEmail) {
        return { success: false, message: 'This email address is already registered by another account.' };
      }
    }

    const updateData = { name: cleanName };
    updateData.phone = cleanPhone || null;
    updateData.email = cleanEmail || null;

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', customer.id)
      .select('*')
      .single();

    if (error) throw error;

    // Update the session cookie
    await setCustomerSessionCookie(updatedUser);

    return { success: true, message: 'Profile updated successfully.' };
  } catch (err) {
    console.error('updateCustomerProfile error:', err);
    return { success: false, message: 'Failed to update profile.' };
  }
}
