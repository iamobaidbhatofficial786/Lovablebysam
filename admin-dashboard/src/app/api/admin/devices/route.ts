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
    const query = searchParams.get('query') || '';
    const licenseId = searchParams.get('license_id') || '';

    const supabase = getSupabaseAdmin();
    const results: any[] = [];

    let ldQuery = supabase.from('license_devices').select('*, licenses(plan_name, plan, customer_name, status)');
    if (licenseId) ldQuery = ldQuery.eq('license_id', licenseId);
    const { data: ld } = await ldQuery.order('last_seen_at', { ascending: false });
    if (ld) ld.forEach((d) => results.push({ ...d, device_hash: d.device_id, source: 'license_devices' }));

    let devQuery = supabase.from('devices').select('*, licenses(plan_name, plan, customer_name, status)');
    if (licenseId) devQuery = devQuery.eq('license_id', licenseId);
    const { data: legacy } = await devQuery.order('last_seen', { ascending: false });
    if (legacy) {
      legacy.forEach((d) => {
        if (!results.some((r) => r.license_id === d.license_id && (r.device_id || r.device_hash) === d.device_hash)) {
          results.push({ ...d, source: 'devices' });
        }
      });
    }

    let filtered = results;
    if (query) {
      const q = query.toLowerCase();
      filtered = results.filter((d) =>
        (d.device_id || d.device_hash || '').toLowerCase().includes(q)
        || (d.ip_address || '').toLowerCase().includes(q),
      );
    }

    return NextResponse.json({ success: true, devices: filtered });
  } catch (err: any) {
    const status = err instanceof AuthError ? 401 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    verifyAuth(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const licenseId = searchParams.get('license_id');
    const deviceId = searchParams.get('device_id');

    const supabase = getSupabaseAdmin();
    let resolvedLicenseId = licenseId;

    if (id) {
      const { data: ld } = await supabase.from('license_devices').select('license_id, device_id').eq('id', id).maybeSingle();
      if (ld) {
        resolvedLicenseId = ld.license_id;
        await supabase.from('license_devices').delete().eq('id', id);
        await supabase.from('devices').delete().eq('license_id', ld.license_id).eq('device_hash', ld.device_id);
      } else {
        const { data: dev } = await supabase.from('devices').select('license_id, device_hash').eq('id', id).maybeSingle();
        if (!dev) return NextResponse.json({ success: false, error: 'Device not found.' }, { status: 404 });
        resolvedLicenseId = dev.license_id;
        await supabase.from('devices').delete().eq('id', id);
        await supabase.from('license_devices').delete().eq('license_id', dev.license_id).eq('device_id', dev.device_hash);
      }
    } else if (licenseId && deviceId) {
      resolvedLicenseId = licenseId;
      await supabase.from('license_devices').delete().eq('license_id', licenseId).eq('device_id', deviceId);
      await supabase.from('devices').delete().eq('license_id', licenseId).eq('device_hash', deviceId);
    } else {
      return NextResponse.json({ success: false, error: 'Device id required.' }, { status: 400 });
    }

    if (resolvedLicenseId) {
      const { count } = await supabase.from('license_devices').select('*', { count: 'exact', head: true }).eq('license_id', resolvedLicenseId);
      await supabase.from('licenses').update({ activation_count: count || 0, updated_at: new Date().toISOString() }).eq('id', resolvedLicenseId);
    }

    return NextResponse.json({ success: true, message: 'Device removed. Extension will logout on next check.' });
  } catch (err: any) {
    const status = err instanceof AuthError ? 401 : 500;
    return NextResponse.json({ success: false, error: err.message }, { status });
  }
}
