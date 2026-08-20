import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkMessageSpam, flagUserIfNeeded } from '@/lib/moderation';

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
      select: { user1Id: true, user2Id: true, status: true },
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
        isOnline: true,
        lastSeen: true,
        showOnlineStatus: true,
        showLastSeen: true,
      },
    });

    const messages = await prisma.message.findMany({
      where: { matchId, deleted: false },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        senderId: true,
        content: true,
        status: true,
        mediaUrl: true,
        replyToId: true,
        read: true,
        createdAt: true,
      },
    });

    // Mark unread messages from the other user as read/seen
    await prisma.message.updateMany({
      where: {
        matchId,
        senderId: otherUserId,
        read: false,
      },
      data: { read: true, status: 'seen' },
    });

    const otherPhotos = otherUser?.photos ? JSON.parse(otherUser.photos) : [];

    return NextResponse.json({
      messages,
      matchStatus: match.status,
      otherUser: otherUser
        ? {
            id: otherUser.id,
            name: otherUser.name,
            username: otherUser.username,
            photo: otherPhotos[0] || null,
            isOnline: otherUser.showOnlineStatus ? otherUser.isOnline : false,
            lastSeen:
              otherUser.showLastSeen && otherUser.lastSeen
                ? otherUser.lastSeen.toISOString()
                : null,
            showOnlineStatus: otherUser.showOnlineStatus,
            showLastSeen: otherUser.showLastSeen,
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
    const { matchId, content, mediaUrl, replyToId } = body;

    if (!matchId || typeof matchId !== 'number') {
      return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
    }

    const hasContent = content && typeof content === 'string' && content.trim().length > 0;
    const hasMedia = mediaUrl && typeof mediaUrl === 'string';

    if (!hasContent && !hasMedia) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    if (content && content.length > 2000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { user1Id: true, user2Id: true, status: true },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const isParticipant =
      match.user1Id === tokenUser.userId || match.user2Id === tokenUser.userId;
    if (!isParticipant) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (match.status !== 'active') {
      return NextResponse.json({ error: 'This match is no longer active' }, { status: 403 });
    }

    // Spam detection
    if (await checkMessageSpam(tokenUser.userId)) {
      await flagUserIfNeeded(tokenUser.userId, 'spam');
      return NextResponse.json({ error: 'Too many messages. Please slow down.' }, { status: 429 });
    }

    const message = await prisma.message.create({
      data: {
        matchId,
        senderId: tokenUser.userId,
        content: hasContent ? content!.trim() : '',
        mediaUrl: hasMedia ? mediaUrl : null,
        replyToId: replyToId || null,
        status: 'sent',
      },
      select: {
        id: true,
        senderId: true,
        content: true,
        status: true,
        mediaUrl: true,
        replyToId: true,
        read: true,
        createdAt: true,
      },
    });

    // Create notification for the recipient
    const otherUserId =
      match.user1Id === tokenUser.userId ? match.user2Id : match.user1Id;
    const me = await prisma.user.findUnique({
      where: { id: tokenUser.userId },
      select: { name: true },
    });
    await prisma.notification.create({
      data: {
        userId: otherUserId,
        type: 'message',
        title: 'New message',
        body: `${me?.name || 'Someone'} sent you a message`,
        link: `/chat/${matchId}`,
        actorId: tokenUser.userId,
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Message POST error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

// DELETE a message (soft delete)
export async function DELETE(request: Request) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const messageId = parseInt(searchParams.get('messageId') || '0', 10);

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { senderId: true },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.senderId !== tokenUser.userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    await prisma.message.update({
      where: { id: messageId },
      data: { deleted: true, deletedBy: tokenUser.userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Message DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}

// PATCH update message status (delivered/seen)
export async function PATCH(request: Request) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { matchId, status } = body;

    if (!matchId || !status) {
      return NextResponse.json({ error: 'matchId and status required' }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { user1Id: true, user2Id: true },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const otherUserId =
      match.user1Id === tokenUser.userId ? match.user2Id : match.user1Id;

    // Update messages from the other user to the new status
    if (status === 'delivered') {
      await prisma.message.updateMany({
        where: { matchId, senderId: otherUserId, status: 'sent' },
        data: { status: 'delivered' },
      });
    } else if (status === 'seen') {
      await prisma.message.updateMany({
        where: { matchId, senderId: otherUserId, read: false },
        data: { status: 'seen', read: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Message PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
