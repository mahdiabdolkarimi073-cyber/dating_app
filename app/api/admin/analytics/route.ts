import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function requireAdmin() {
  const tokenUser = await getAuthUser();
  if (!tokenUser) return null;
  const user = await prisma.user.findUnique({
    where: { id: tokenUser.userId },
    select: { role: true, id: true },
  });
  if (!user || !['admin', 'super_admin', 'moderator'].includes(user.role)) return null;
  return user;
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const [
      totalUsers,
      activeUsers,
      premiumUsers,
      verifiedUsers,
      totalLikes,
      totalMatches,
      totalMessages,
      totalStories,
      activeBoosts,
      pendingReports,
      pendingVerifications,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'active' } }),
      prisma.user.count({ where: { isPremium: true } }),
      prisma.user.count({ where: { verification: 'verified' } }),
      prisma.like.count(),
      prisma.match.count({ where: { status: 'active' } }),
      prisma.message.count({ where: { deleted: false } }),
      prisma.story.count(),
      prisma.boost.count({ where: { status: 'active', expiresAt: { gt: new Date() } } }),
      prisma.report.count({ where: { status: 'pending' } }),
      prisma.verificationRequest.count({ where: { status: 'pending' } }),
    ]);

    // DAU/WAU/MAU
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [dau, wau, mau] = await Promise.all([
      prisma.user.count({ where: { lastSeen: { gt: dayAgo } } }),
      prisma.user.count({ where: { lastSeen: { gt: weekAgo } } }),
      prisma.user.count({ where: { lastSeen: { gt: monthAgo } } }),
    ]);

    // Registration rate (last 7 days)
    const newUsers = await prisma.user.count({ where: { createdAt: { gt: weekAgo } } });

    // Profile completion rate
    const completedProfiles = await prisma.user.count({
      where: {
        username: { not: null },
        photos: { not: null },
        bio: { not: null },
        interests: { not: null },
        termsAccepted: true,
      },
    });

    // Conversion rates
    const likeToMatchRate = totalLikes > 0 ? (totalMatches / totalLikes) * 100 : 0;
    const matchToMessageRate = totalMatches > 0 ? (totalMessages / totalMatches) * 100 : 0;
    const premiumConversionRate = totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0;

    // Daily registrations for chart (last 7 days)
    const dailyRegistrations: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const count = await prisma.user.count({
        where: { createdAt: { gte: dayStart, lt: dayEnd } },
      });
      dailyRegistrations.push({
        date: dayStart.toISOString().split('T')[0],
        count,
      });
    }

    return NextResponse.json({
      overview: {
        totalUsers,
        activeUsers,
        premiumUsers,
        verifiedUsers,
        totalLikes,
        totalMatches,
        totalMessages,
        totalStories,
        activeBoosts,
        pendingReports,
        pendingVerifications,
      },
      retention: { dau, wau, mau },
      rates: {
        newUsersThisWeek: newUsers,
        profileCompletionRate: totalUsers > 0 ? (completedProfiles / totalUsers) * 100 : 0,
        likeToMatchRate,
        matchToMessageRate,
        premiumConversionRate,
      },
      chart: { dailyRegistrations },
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
