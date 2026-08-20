import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await request.json();
    const { password, confirm } = body;

    if (!confirm) {
      return NextResponse.json({ error: 'Confirmation required' }, { status: 400 });
    }

    // Verify password
    const user = await prisma.user.findUnique({ where: { id: tokenUser.userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const bcrypt = await import('bcryptjs');
    if (password && !bcrypt.compareSync(password, user.password)) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 403 });
    }

    // Mark deletion requested (grace period of 30 days)
    await prisma.user.update({
      where: { id: tokenUser.userId },
      data: {
        deletionRequestedAt: new Date(),
        status: 'suspended',
        showInDiscovery: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Account scheduled for deletion in 30 days. You can cancel by logging in again.',
    });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    // Cancel deletion request
    await prisma.user.update({
      where: { id: tokenUser.userId },
      data: {
        deletionRequestedAt: null,
        status: 'active',
        showInDiscovery: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
