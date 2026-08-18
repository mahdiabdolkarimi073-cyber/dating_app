import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST mark a story as viewed
export async function POST(request: Request) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { storyId } = body;

    if (!storyId || typeof storyId !== 'number') {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
    }

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true, userId: true },
    });

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Create view record if it doesn't exist (unique constraint prevents duplicates)
    try {
      await prisma.storyView.create({
        data: {
          storyId,
          viewerId: tokenUser.userId,
        },
      });
    } catch {
      // Already viewed — that's fine
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Story view error:', error);
    return NextResponse.json({ error: 'Failed to mark story as viewed' }, { status: 500 });
  }
}
