import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request) {
  try {
    const tokenUser = await getAuthUser();
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { photos } = body;

    if (!Array.isArray(photos)) {
      return NextResponse.json({ error: 'Photos must be an array' }, { status: 400 });
    }

    if (photos.length < 1) {
      return NextResponse.json(
        { error: 'Please upload at least 1 photo' },
        { status: 400 }
      );
    }

    if (photos.length > 6) {
      return NextResponse.json(
        { error: 'You can upload up to 6 photos' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: tokenUser.userId },
      data: { photos: JSON.stringify(photos) },
      select: {
        id: true,
        name: true,
        username: true,
        interests: true,
        photos: true,
        termsAccepted: true,
      },
    });

    return NextResponse.json({
      user: updatedUser,
      message: 'Photos saved successfully',
    });
  } catch (error) {
    console.error('Photos update error:', error);
    return NextResponse.json(
      { error: 'Failed to save photos' },
      { status: 500 }
    );
  }
}
