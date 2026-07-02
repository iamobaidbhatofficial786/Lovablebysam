import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase';
import jwt from 'jsonwebtoken';

export async function GET(request: Request) {
  try {
    // Auth Check
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const adminSecret = process.env.ADMIN_SECRET || 'fallback_secret';

    try {
      jwt.verify(token, adminSecret);
    } catch (e) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Run counts in parallel
    const [
      { count: totalLicenses },
      { count: activeLicenses },
      { count: suspendedLicenses },
      { count: revokedLicenses },
      { count: expiredLicenses },
      { count: deviceCount },
    ] = await Promise.all([
      supabase.from('licenses').select('*', { count: 'exact', head: true }),
      supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
      supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'revoked'),
      supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'expired'),
      supabase.from('devices').select('*', { count: 'exact', head: true }),
    ]);

    // Get recent security events
    const { data: recentEvents } = await supabase
      .from('security_events')
      .select('*, licenses(plan_name)')
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      stats: {
        total: totalLicenses || 0,
        active: activeLicenses || 0,
        suspended: suspendedLicenses || 0,
        revoked: revokedLicenses || 0,
        expired: expiredLicenses || 0,
        devices: deviceCount || 0,
      },
      recentEvents: recentEvents || [],
    });
  } catch (err: any) {
    console.error('[API Stats Error]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
