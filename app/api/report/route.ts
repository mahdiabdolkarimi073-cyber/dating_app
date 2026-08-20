import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const VALID_REASONS = [
  'harassment',
  'fake_profile',
  'inappropriate_content',
  'scam',
  'spam',
  'other',
];

// POST report a user or message
export async function POST(request: Request) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { reportedId, reason, description, targetType, targetMessageId } = body;

    if (!reportedId || typeof reportedId !== 'number') {
      return NextResponse.json({ error: 'Invalid reported user ID' }, { status: 400 });
    }

    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
    }

    if (reportedId === tokenUser.userId) {
      return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { id: reportedId },
      select: { id: true },
    });
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const report = await prisma.report.create({
      data: {
        reporterId: tokenUser.userId,
        reportedId,
        targetType: targetType === 'message' ? 'message' : 'user',
        targetMessageId: targetMessageId || null,
        reason,
        description: description || null,
      },
    });

    // Notify admins
    const admins = await prisma.user.findMany({
      where: { role: { in: ['admin', 'super_admin', 'moderator'] } },
      select: { id: true },
    });
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: 'report',
        title: 'New report',
        body: `A user was reported for ${reason.replace('_', ' ')}`,
        link: '/admin/reports',
      })),
    });

    return NextResponse.json({ success: true, reportId: report.id });
  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}
