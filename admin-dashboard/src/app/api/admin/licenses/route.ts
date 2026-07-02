import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase';
import { generateLicenseKey, sha256 } from '../../../../lib/crypto';
import jwt from 'jsonwebtoken';

class AuthError extends Error {
  status = 401;
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

function verifyAuth(request: Request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const adminSecret = process.env.ADMIN_SECRET || 'fallback_secret';
  try {
    return jwt.verify(token, adminSecret);
  } catch (err: any) {
    throw new AuthError(err.message || 'Unauthorized');
  }
}

// GET: list & search licenses
export async function GET(request: Request) {
  try {
    verifyAuth(request);
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';

    const supabase = getSupabaseAdmin();
    let dbQuery = supabase.from('licenses').select('*');

    if (query) {
      // If query looks like a key, search by its hash
      if (/^LPK-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(query.trim())
        || /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(query.trim())) {
        const hashedQuery = sha256(query.trim());
        dbQuery = dbQuery.eq('license_key_hash', hashedQuery);
      } else {
        // Search in plan_name or notes
        dbQuery = dbQuery.or(`plan_name.ilike.%${query}%,notes.ilike.%${query}%`);
      }
    }

    const { data: licenses, error } = await dbQuery.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, licenses });
  } catch (err: any) {
    const status = err instanceof AuthError ? 401 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

// POST: create a new license
export async function POST(request: Request) {
  try {
    verifyAuth(request);
    const { plan_name, plan, customer_name, customer_email, max_devices, expires_at, notes, admin_message, support_url, support_telegram } = await request.json();

    const planLabel = plan_name || plan || 'pro';

    if (!planLabel) {
      return NextResponse.json({ success: false, error: 'plan is required.' }, { status: 400 });
    }

    const rawKey = generateLicenseKey();
    const hash = sha256(rawKey);

    const supabase = getSupabaseAdmin();

    const insertPayload: Record<string, unknown> = {
      license_key_hash: hash,
      plan_name: planLabel,
      max_devices: max_devices || 1,
      expires_at: expires_at || null,
      notes: notes || [customer_name, customer_email].filter(Boolean).join(' | ') || '',
      status: 'active',
      active: true,
      admin_message: admin_message || '',
      support_url: support_url || '',
      support_telegram: support_telegram || '',
    };

    if (customer_name) insertPayload.customer_name = customer_name;
    if (customer_email) insertPayload.customer_email = customer_email;
    if (plan) insertPayload.plan = plan;

    let insertResult = await supabase
      .from('licenses')
      .insert(insertPayload)
      .select('*')
      .single();

    if (insertResult.error && /admin_message|support_url|support_telegram|updated_at/i.test(insertResult.error.message || '')) {
      const fallbackPayload = { ...insertPayload };
      delete fallbackPayload.admin_message;
      delete fallbackPayload.support_url;
      delete fallbackPayload.support_telegram;
      delete fallbackPayload.updated_at;
      insertResult = await supabase
        .from('licenses')
        .insert(fallbackPayload)
        .select('*')
        .single();
    }

    if (insertResult.error) throw insertResult.error;
    const license = insertResult.data;

    // Return the raw key to show the user ONCE
    return NextResponse.json({ success: true, license, rawKey });
  } catch (err: any) {
    const status = err instanceof AuthError ? 401 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

// PATCH: update / suspend / revoke / extend license
export async function PATCH(request: Request) {
  try {
    verifyAuth(request);
    const { id, plan_name, plan, customer_name, customer_email, max_devices, expires_at, notes, status, admin_message, support_url, support_telegram } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'License id is required.' }, { status: 400 });
    }

    const updates: any = {};
    if (plan_name !== undefined) updates.plan_name = plan_name;
    if (plan !== undefined) { updates.plan = plan; updates.plan_name = plan; }
    if (customer_name !== undefined) updates.customer_name = customer_name;
    if (customer_email !== undefined) updates.customer_email = customer_email;
    if (max_devices !== undefined) updates.max_devices = max_devices;
    if (expires_at !== undefined) updates.expires_at = expires_at || null;
    if (notes !== undefined) updates.notes = notes;
    if (admin_message !== undefined) updates.admin_message = admin_message;
    if (support_url !== undefined) updates.support_url = support_url;
    if (support_telegram !== undefined) updates.support_telegram = support_telegram;
    
    if (status !== undefined) {
      updates.status = status;
      updates.active = status === 'active';
      updates.suspended = status === 'suspended';
      updates.revoked = status === 'revoked';
      updates.expired = status === 'expired';
    }

    const supabase = getSupabaseAdmin();
    let updateResult = await supabase
      .from('licenses')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (updateResult.error && /admin_message|support_url|support_telegram|updated_at/i.test(updateResult.error.message || '')) {
      const fallbackUpdates = { ...updates };
      delete fallbackUpdates.admin_message;
      delete fallbackUpdates.support_url;
      delete fallbackUpdates.support_telegram;
      delete fallbackUpdates.updated_at;
      updateResult = await supabase
        .from('licenses')
        .update(fallbackUpdates)
        .eq('id', id)
        .select('*')
        .single();
    }

    if (updateResult.error) throw updateResult.error;
    const license = updateResult.data;

    return NextResponse.json({ success: true, license });
  } catch (err: any) {
    const status = err instanceof AuthError ? 401 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

// DELETE: delete a license
export async function DELETE(request: Request) {
  try {
    verifyAuth(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'License id is required.' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('licenses').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    const status = err instanceof AuthError ? 401 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
