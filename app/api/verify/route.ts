import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const existing = await prisma.verificationRequest.findUnique({
      where: { userId: tokenUser.userId },
    });

    const user = await prisma.user.findUnique({
      where: { id: tokenUser.userId },
      select: { verification: true },
    });

    return NextResponse.json({
      status: user?.verification || 'none',
      request: existing ? {
        id: existing.id,
        status: existing.status,
        submittedAt: existing.submittedAt,
        reviewedAt: existing.reviewedAt,
      } : null,
    });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await request.json();
    const { photoUrl } = body;
    if (!photoUrl) return NextResponse.json({ error: 'Photo required' }, { status: 400 });

    const existing = await prisma.verificationRequest.findUnique({
      where: { userId: tokenUser.userId },
    });

    if (existing && existing.status === 'pending') {
      return NextResponse.json({ error: 'Verification already pending' }, { status: 400 });
    }

    if (existing) {
      await prisma.verificationRequest.update({
        where: { userId: tokenUser.userId },
        data: { status: 'pending', photoUrl, submittedAt: new Date(), reviewedAt: null, reviewedBy: null },
      });
    } else {
      await prisma.verificationRequest.create({
        data: { userId: tokenUser.userId, photoUrl, status: 'pending' },
      });
    }

    await prisma.user.update({
      where: { id: tokenUser.userId },
      data: { verification: 'pending' },
    });

    return NextResponse.json({ success: true, status: 'pending' });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
