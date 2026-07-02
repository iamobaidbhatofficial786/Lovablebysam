import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase';
import { sha256 } from '../../../../lib/crypto';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  try {
    const { key } = await request.json();
    if (!key) {
      return NextResponse.json({ ok: false, reason: 'invalid_payload' }, { status: 400, headers });
    }

    const hashedKey = sha256(key.trim());
    const supabase = getSupabaseAdmin();

    const { data: license, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key_hash', hashedKey)
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ ok: false, reason: 'database_error' }, { status: 500, headers });
    }

    if (!license) {
      return NextResponse.json({ ok: false, reason: 'invalid' }, { status: 200, headers });
    }

    // Check status
    if (license.status !== 'active') {
      return NextResponse.json({ ok: false, reason: license.status || 'inactive' }, { status: 200, headers });
    }

    // Check expiration
    if (license.expires_at) {
      const expirationDate = new Date(license.expires_at);
      if (expirationDate < new Date()) {
        // Automatically update status to expired in database
        await supabase
          .from('licenses')
          .update({ status: 'expired' })
          .eq('id', license.id);
        return NextResponse.json({ ok: false, reason: 'expired' }, { status: 200, headers });
      }
    }

    // Success response formatted for EliteBytes Chrome Extension
    const responseData = {
      ql_license_valid: true,
      ql_license_key: key.trim(),
      ql_session_id: 'session_' + sha256(key.trim() + Date.now().toString()).slice(0, 16),
      ql_user_name: license.customer_name || license.plan_name || 'Premium User',
      ql_license_status: 'active',
      ql_expires_at: license.expires_at || null,
      ql_activated_at: new Date().toISOString(),
    };

    return NextResponse.json(responseData, { status: 200, headers });

  } catch (err: any) {
    console.error('Validation error:', err);
    return NextResponse.json({ ok: false, reason: err.message }, { status: 500, headers });
  }
}
