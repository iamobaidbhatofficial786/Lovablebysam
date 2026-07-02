import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../../lib/supabase';
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
  try {
    return jwt.verify(token, process.env.ADMIN_SECRET || 'fallback_secret');
  } catch (err: any) {
    throw new AuthError(err.message || 'Unauthorized');
  }
}

export async function POST(request: Request) {
  try {
    verifyAuth(request);
    const { id, action } = await request.json();
    if (!id) return NextResponse.json({ success: false, error: 'License id required.' }, { status: 400 });

    const supabase = getSupabaseAdmin();

    if (action === 'reset_devices') {
      await supabase.from('license_devices').delete().eq('license_id', id);
      await supabase.from('devices').delete().eq('license_id', id);
      await supabase.from('licenses').update({ activation_count: 0, updated_at: new Date().toISOString() }).eq('id', id);
      return NextResponse.json({ success: true, message: 'All devices reset.' });
    }

    // remove_access (default)
    await supabase.from('license_devices').delete().eq('license_id', id);
    await supabase.from('devices').delete().eq('license_id', id);
    await supabase.from('licenses').update({
      status: 'revoked',
      revoked: true,
      active: false,
      suspended: false,
      activation_count: 0,
      updated_at: new Date().toISOString(),
    }).eq('id', id);

    return NextResponse.json({ success: true, message: 'User access removed. Extension will logout within ~30s.' });
  } catch (err: any) {
    const status = err instanceof AuthError ? 401 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
