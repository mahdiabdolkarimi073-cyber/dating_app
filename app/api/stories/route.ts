import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET stories feed — stories from users you've matched with, plus your own
export async function GET() {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = tokenUser.userId;

    // Get all match partner IDs
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      select: { user1Id: true, user2Id: true },
    });

    const partnerIds = matches.map((m) =>
      m.user1Id === userId ? m.user2Id : m.user1Id
    );

    // Include self in the feed so user sees their own stories
    const userIds = Array.from(new Set([userId, ...partnerIds]));

    // Stories expire after 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stories = await prisma.story.findMany({
      where: {
        userId: { in: userIds },
        createdAt: { gt: twentyFourHoursAgo },
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, photos: true },
        },
        views: {
          select: { viewerId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group stories by user
    const userMap = new Map<number, {
      userId: number;
      name: string | null;
      username: string | null;
      photo: string | null;
      stories: Array<{
        id: number;
        mediaUrl: string;
        caption: string | null;
        createdAt: string;
        viewed: boolean;
        viewCount: number;
      }>;
    }>();

    for (const story of stories) {
      const photos = story.user.photos ? JSON.parse(story.user.photos) : [];
      const viewed = story.views.some((v) => v.viewerId === userId);

      if (!userMap.has(story.userId)) {
        userMap.set(story.userId, {
          userId: story.userId,
          name: story.user.name,
          username: story.user.username,
          photo: photos[0] || null,
          stories: [],
        });
      }

      userMap.get(story.userId)!.stories.push({
        id: story.id,
        mediaUrl: story.mediaUrl,
        caption: story.caption,
        createdAt: story.createdAt.toISOString(),
        viewed,
        viewCount: story.views.length,
      });
    }

    // Sort: unviewed first, then by story count
    const feed = Array.from(userMap.values()).sort((a, b) => {
      const aHasUnviewed = a.stories.some((s) => !s.viewed);
      const bHasUnviewed = b.stories.some((s) => !s.viewed);
      if (aHasUnviewed && !bHasUnviewed) return -1;
      if (!aHasUnviewed && bHasUnviewed) return 1;
      return 0;
    });

    return NextResponse.json({ feed });
  } catch (error) {
    console.error('Stories feed error:', error);
    return NextResponse.json({ error: 'Failed to load stories' }, { status: 500 });
  }
}

// POST create a new story
export async function POST(request: Request) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { mediaUrl, caption } = body;

    if (!mediaUrl || typeof mediaUrl !== 'string') {
      return NextResponse.json({ error: 'Media URL is required' }, { status: 400 });
    }

    if (caption && caption.length > 200) {
      return NextResponse.json({ error: 'Caption too long' }, { status: 400 });
    }

    // Check if user already has an active story (limit 1 per 24h)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingStory = await prisma.story.findFirst({
      where: {
        userId: tokenUser.userId,
        createdAt: { gt: twentyFourHoursAgo },
      },
    });

    if (existingStory) {
      return NextResponse.json(
        { error: 'You already have an active story. Wait for it to expire.' },
        { status: 400 }
      );
    }

    const story = await prisma.story.create({
      data: {
        userId: tokenUser.userId,
        mediaUrl,
        caption: caption || null,
      },
      select: {
        id: true,
        mediaUrl: true,
        caption: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ story });
  } catch (error) {
    console.error('Story create error:', error);
    return NextResponse.json({ error: 'Failed to create story' }, { status: 500 });
  }
}
