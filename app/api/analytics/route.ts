import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const userId = tokenUser.userId;

    const [likesGiven, matches, messages, profileViews, stories, superLikesGiven] = await Promise.all([
      prisma.like.count({ where: { fromId: userId } }),
      prisma.match.count({ where: { OR: [{ user1Id: userId }, { user2Id: userId }], status: 'active' } }),
      prisma.message.count({ where: { senderId: userId, deleted: false } }),
      prisma.profileView.count({ where: { viewedId: userId } }),
      prisma.story.count({ where: { userId } }),
      prisma.like.count({ where: { fromId: userId, superLike: true } }),
    ]);

    // Recent views (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentViews = await prisma.profileView.count({
      where: { viewedId: userId, createdAt: { gt: weekAgo } },
    });

    // Recent likes (last 7 days)
    const recentLikes = await prisma.like.count({
      where: { toId: userId, createdAt: { gt: weekAgo } },
    });

    return NextResponse.json({
      stats: {
        likesGiven,
        matches,
        messages,
        profileViews,
        stories,
        superLikesGiven,
        recentViews,
        recentLikes,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
