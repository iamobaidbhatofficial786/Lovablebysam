import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ success: false, error: 'Password is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Query the first admin user from DB
    const { data: users, error } = await supabase
      .from('admin_users')
      .select('*')
      .limit(1);

    if (error || !users || users.length === 0) {
      return NextResponse.json({ success: false, error: 'Authentication failed. Database connection error or no admin user found.' }, { status: 401 });
    }

    const user = users[0];

    // Verify bcrypt password hash
    const passwordIsValid = bcrypt.compareSync(password, user.password_hash);
    if (!passwordIsValid) {
      return NextResponse.json({ success: false, error: 'Invalid password.' }, { status: 401 });
    }

    const adminSecret = process.env.ADMIN_SECRET || 'fallback_secret';
    
    // Generate admin session JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      adminSecret,
      { expiresIn: '12h' }
    );

    return NextResponse.json({ success: true, token });
  } catch (err: any) {
    console.error('[Admin Login Route Error]:', err);
    return NextResponse.json({ success: false, error: 'Internal server error: ' + err.message }, { status: 500 });
  }
}
