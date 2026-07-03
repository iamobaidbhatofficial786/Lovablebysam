import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase';
import { sha256, allLicenseKeyHashes, licenseKeyLookupVariants, normalizeLicenseKey } from '../../../../lib/crypto';

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') || '*';
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin') || '*';
  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  try {
    const body = await request.json();
    const key = (body.license_key || body.key || body.licenseKey || '').trim();
    const deviceId = (body.device_id || body.deviceId || '').trim();

    console.log('[API] Request reached API for license verification.');

    if (!key) {
      console.log('[API] Validation failed: Key is missing.');
      return NextResponse.json({ success: false, valid: false, status: 'inactive', reason: 'invalid_payload' }, { status: 400, headers });
    }

    const trimmedKey = key.toUpperCase();
    const hash = sha256(trimmedKey);

    const supabase = getSupabaseAdmin();

    const { data: license, error } = await supabase
      .from('licenses')
      .select('*')
      .eq('license_key_hash', hash)
      .maybeSingle();

    if (error) {
      console.error('[API] Supabase error:', error);
      return NextResponse.json({ success: false, valid: false, status: 'inactive', reason: 'database_error' }, { status: 500, headers });
    }

    if (!license) {
      console.log('[API] License check result: License not found.');
      return NextResponse.json({ success: false, valid: false, status: 'inactive', reason: 'invalid' }, { status: 200, headers });
    }

    console.log('[API] License check result: License found. ID:', license.id);

    // Check status
    if (license.status !== 'active') {
      console.log('[API] License check result: License is inactive/suspended/revoked. Status:', license.status);
      return NextResponse.json({ success: false, valid: false, status: 'inactive', reason: license.status || 'inactive' }, { status: 200, headers });
    }

    // Check expiration
    if (license.expires_at) {
      const expirationDate = new Date(license.expires_at);
      if (expirationDate < new Date()) {
        console.log('[API] License check result: License has expired.');
        // Automatically update status to expired in database
        await supabase
          .from('licenses')
          .update({ status: 'expired' })
          .eq('id', license.id);
        return NextResponse.json({ success: false, valid: false, status: 'inactive', reason: 'expired' }, { status: 200, headers });
      }
    }

    console.log('[API] License status check: License is active.');

    // --- Device Limit Check ---
    if (!deviceId) {
      console.log('[API] Device check result: Device ID is missing in request.');
      return NextResponse.json({ success: false, valid: false, status: 'inactive', reason: 'device_missing' }, { status: 200, headers });
    }

    // Check if this device is already registered for this license
    const { data: existingDevice, error: deviceError } = await supabase
      .from('license_devices')
      .select('*')
      .eq('license_id', license.id)
      .eq('device_id', deviceId)
      .maybeSingle();

    if (deviceError) {
      console.error('[API] Supabase device query error:', deviceError);
      return NextResponse.json({ success: false, valid: false, status: 'inactive', reason: 'database_error' }, { status: 500, headers });
    }

    if (existingDevice) {
      console.log('[API] Device check result: Device is already registered. Updating last seen.');
      // Device is already registered, update last seen
      await supabase
        .from('license_devices')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', existingDevice.id);
    } else {
      // New device: count current active devices for this license
      const { count, error: countError } = await supabase
        .from('license_devices')
        .select('*', { count: 'exact', head: true })
        .eq('license_id', license.id);

      if (countError) {
        console.error('[API] Supabase count error:', countError);
        return NextResponse.json({ success: false, valid: false, status: 'inactive', reason: 'database_error' }, { status: 500, headers });
      }

      const activeCount = count !== null ? count : (license.activation_count || 0);
      const maxDevices = license.max_devices || 1;

      console.log(`[API] Device count: ${activeCount} / ${maxDevices}`);

      if (activeCount >= maxDevices) {
        console.log('[API] Device check result: Device limit reached.');
        return NextResponse.json({ success: false, valid: false, status: 'inactive', reason: 'device_limit' }, { status: 200, headers });
      }

      console.log('[API] Device check result: Registering new device.');
      // Register new device
      const { error: insertError } = await supabase
        .from('license_devices')
        .insert({
          license_id: license.id,
          device_id: deviceId,
          activated_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('[API] Supabase device registration error:', insertError);
        return NextResponse.json({ success: false, valid: false, status: 'inactive', reason: 'database_error' }, { status: 500, headers });
      }

      // Update license activation count
      await supabase
        .from('licenses')
        .update({ activation_count: activeCount + 1 })
        .eq('id', license.id);
    }

    console.log('[API] License verification successfully completed.');

    // Success response formatted for EliteBytes Chrome Extension
    return NextResponse.json({
      success: true,
      valid: true,
      status: 'active'
    }, { status: 200, headers });

  } catch (err: any) {
    console.error('[API] Validation error:', err);
    return NextResponse.json({ success: false, valid: false, status: 'inactive', reason: err.message }, { status: 500, headers });
  }
}
