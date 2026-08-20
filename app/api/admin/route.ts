import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function requireAdmin() {
  const tokenUser = await getAuthUser();
  if (!tokenUser) return null;
  const user = await prisma.user.findUnique({
    where: { id: tokenUser.userId },
    select: { role: true, status: true },
  });
  if (!user || user.status !== 'active' || !['admin', 'super_admin', 'moderator'].includes(user.role)) {
    return null;
  }
  return tokenUser;
}

// GET dashboard stats
export async function GET(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'dashboard';

    if (section === 'dashboard') {
      const [users, activeUsers, matches, messages, likes, reports, newAccounts] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: 'active' } }),
        prisma.match.count(),
        prisma.message.count(),
        prisma.like.count(),
        prisma.report.count({ where: { status: 'pending' } }),
        prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      ]);
      return NextResponse.json({ stats: { users, activeUsers, matches, messages, likes, reports, newAccounts } });
    }

    if (section === 'users') {
      const q = searchParams.get('q') || '';
      const users = await prisma.user.findMany({
        where: q
          ? {
              OR: [
                { name: { contains: q } },
                { username: { contains: q } },
                { email: { contains: q } },
              ],
            }
          : undefined,
        select: {
          id: true, name: true, username: true, email: true, role: true,
          status: true, createdAt: true, moderationFlag: true, suspendedUntil: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      return NextResponse.json({ users });
    }

    if (section === 'reports') {
      const reports = await prisma.report.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          reporter: { select: { id: true, name: true, username: true } },
          reported: { select: { id: true, name: true, username: true, photos: true } },
        },
      });
      return NextResponse.json({ reports });
    }

    if (section === 'stories') {
      const stories = await prisma.story.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          user: { select: { id: true, name: true, username: true } },
        },
      });
      return NextResponse.json({ stories });
    }

    if (section === 'verifications') {
      const requests = await prisma.verificationRequest.findMany({
        where: { status: 'pending' },
        orderBy: { submittedAt: 'desc' },
        take: 50,
        include: {
          user: {
            select: { id: true, name: true, username: true, email: true, photos: true },
          },
        },
      });
      return NextResponse.json({ requests });
    }

    if (section === 'matches') {
      const matches = await prisma.match.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          user1: { select: { id: true, name: true, username: true } },
          user2: { select: { id: true, name: true, username: true } },
        },
      });
      return NextResponse.json({ matches });
    }

    if (section === 'moderation') {
      const logs = await prisma.moderationLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      const userIds = Array.from(new Set(logs.map((l) => l.userId)));
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, username: true },
      });
      const userMap = new Map(users.map((u) => [u.id, u]));
      const logsWithUser = logs.map((l) => ({ ...l, user: userMap.get(l.userId) }));
      const flaggedUsers = await prisma.user.findMany({
        where: { moderationFlag: { not: null } },
        select: { id: true, name: true, username: true, moderationFlag: true, flaggedAt: true },
      });
      return NextResponse.json({ logs: logsWithUser, flaggedUsers });
    }

    return NextResponse.json({ error: 'Unknown section' }, { status: 400 });
  } catch (error) {
    console.error('Admin GET error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// PATCH user management (suspend/ban/unban/role)
export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, action, role, duration } = body;

    if (!userId || typeof userId !== 'number') {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Handle story moderation actions (storyId passed instead of userId)
    if (action === 'story_approve' || action === 'story_flag' || action === 'story_remove') {
      const storyId = body.storyId;
      if (!storyId || typeof storyId !== 'number') {
        return NextResponse.json({ error: 'Story ID required' }, { status: 400 });
      }
      const modStatus = action === 'story_approve' ? 'approved' : action === 'story_flag' ? 'flagged' : 'removed';
      await prisma.story.update({
        where: { id: storyId },
        data: { moderation: modStatus },
      });
      return NextResponse.json({ success: true });
    }

    // Handle verification review
    if (action === 'approve_verification' || action === 'reject_verification') {
      const verUserId = body.verUserId;
      if (!verUserId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });
      const newStatus = action === 'approve_verification' ? 'verified' : 'rejected';
      await prisma.verificationRequest.updateMany({
        where: { userId: verUserId, status: 'pending' },
        data: { status: newStatus, reviewedAt: new Date(), reviewedBy: admin.userId },
      });
      await prisma.user.update({
        where: { id: verUserId },
        data: { verification: newStatus },
      });
      return NextResponse.json({ success: true });
    }

    // Handle report review
    if (action === 'reviewReport') {
      const reportId = body.reportId;
      if (!reportId) {
        return NextResponse.json({ error: 'Report ID required' }, { status: 400 });
      }
      await prisma.report.update({
        where: { id: reportId },
        data: { status: 'reviewed', reviewedAt: new Date(), reviewedBy: admin.userId },
      });
      return NextResponse.json({ success: true });
    }

    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only super_admin can manage admins
    const adminUser = await prisma.user.findUnique({ where: { id: admin.userId }, select: { role: true } });
    if (['admin', 'super_admin'].includes(target.role) && adminUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    if (action === 'suspend') {
      const until = duration ? new Date(Date.now() + duration * 60 * 60 * 1000) : null;
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'suspended', suspendedUntil: until },
      });
    } else if (action === 'ban') {
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'banned', suspendedUntil: null },
      });
    } else if (action === 'unban' || action === 'unsuspend') {
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'active', suspendedUntil: null },
      });
    } else if (action === 'role' && role) {
      if (!['user', 'moderator', 'admin', 'super_admin'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      await prisma.user.update({
        where: { id: userId },
        data: { role },
      });
    } else if (action === 'clearFlag') {
      await prisma.user.update({
        where: { id: userId },
        data: { moderationFlag: null, flaggedAt: null },
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin PATCH error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// DELETE user (admin only)
export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const adminUser = await prisma.user.findUnique({ where: { id: admin.userId }, select: { role: true } });
    if (adminUser?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super admin can delete users' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = parseInt(searchParams.get('userId') || '0', 10);

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
