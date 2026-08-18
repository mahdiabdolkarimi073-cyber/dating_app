import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET messages for a match
export async function GET(request: Request) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const matchId = parseInt(searchParams.get('matchId') || '0', 10);

    if (!matchId) {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { user1Id: true, user2Id: true },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const isParticipant =
      match.user1Id === tokenUser.userId || match.user2Id === tokenUser.userId;
    if (!isParticipant) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const otherUserId =
      match.user1Id === tokenUser.userId ? match.user2Id : match.user1Id;

    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: {
        id: true,
        name: true,
        username: true,
        photos: true,
      },
    });

    const messages = await prisma.message.findMany({
      where: { matchId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        senderId: true,
        content: true,
        read: true,
        createdAt: true,
      },
    });

    // Mark unread messages from the other user as read
    await prisma.message.updateMany({
      where: {
        matchId,
        senderId: otherUserId,
        read: false,
      },
      data: { read: true },
    });

    const otherPhotos = otherUser?.photos ? JSON.parse(otherUser.photos) : [];

    return NextResponse.json({
      messages,
      otherUser: otherUser
        ? {
            id: otherUser.id,
            name: otherUser.name,
            username: otherUser.username,
            photo: otherPhotos[0] || null,
          }
        : null,
    });
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
  }
}

// POST a new message
export async function POST(request: Request) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { matchId, content } = body;

    if (!matchId || typeof matchId !== 'number') {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { user1Id: true, user2Id: true },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const isParticipant =
      match.user1Id === tokenUser.userId || match.user2Id === tokenUser.userId;
    if (!isParticipant) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const message = await prisma.message.create({
      data: {
        matchId,
        senderId: tokenUser.userId,
        content: content.trim(),
      },
      select: {
        id: true,
        senderId: true,
        content: true,
        read: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Message POST error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
