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
    const { interests } = body;

    if (!Array.isArray(interests)) {
      return NextResponse.json({ error: 'Interests must be an array' }, { status: 400 });
    }

    if (interests.length < 1) {
      return NextResponse.json(
        { error: 'Please select at least 1 interest' },
        { status: 400 }
      );
    }

    if (interests.length > 5) {
      return NextResponse.json(
        { error: 'You can select up to 5 interests' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: tokenUser.userId },
      data: { interests: JSON.stringify(interests) },
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
      message: 'Interests saved successfully',
    });
  } catch (error) {
    console.error('Interests update error:', error);
    return NextResponse.json(
      { error: 'Failed to save interests' },
      { status: 500 }
    );
  }
}
