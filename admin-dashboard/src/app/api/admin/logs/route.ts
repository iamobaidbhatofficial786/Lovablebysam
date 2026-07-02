import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase';
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

export async function GET(request: Request) {
  try {
    verifyAuth(request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    const supabase = getSupabaseAdmin();
    
    let activationsList: any[] = [];
    let securityList: any[] = [];

    // Fetch activations if selected
    if (type === 'all' || type === 'activations') {
      const { data: activations, error: actErr } = await supabase
        .from('activations')
        .select('*, licenses(plan_name), devices(device_hash)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (actErr) throw actErr;
      activationsList = (activations || []).map(a => ({
        id: a.id,
        log_type: 'activation',
        license_id: a.license_id,
        plan_name: a.licenses?.plan_name || 'N/A',
        device_hash: a.devices?.device_hash || 'N/A',
        action: a.action,
        ip_address: a.ip_address,
        country: a.country,
        created_at: a.created_at,
        details: null
      }));
    }

    // Fetch security events if selected
    if (type === 'all' || type === 'security') {
      const { data: security, error: secErr } = await supabase
        .from('security_events')
        .select('*, licenses(plan_name), devices(device_hash)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (secErr) throw secErr;
      securityList = (security || []).map(s => ({
        id: s.id,
        log_type: 'security',
        license_id: s.license_id,
        plan_name: s.licenses?.plan_name || 'N/A',
        device_hash: s.device_hash || s.devices?.device_hash || 'N/A',
        action: s.event_type,
        ip_address: s.ip_address,
        country: s.country,
        created_at: s.created_at,
        details: s.details
      }));
    }

    // Merge and sort lists
    const mergedLogs = [...activationsList, ...securityList].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ).slice(0, 150);

    return NextResponse.json({ success: true, logs: mergedLogs });
  } catch (err: any) {
    console.error('[API Logs Error]:', err);
    const status = err instanceof AuthError ? 401 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
