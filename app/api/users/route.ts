import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../db';
import { users } from '../../../db/schema';
import { eq } from 'drizzle-orm';

export type NewUser = typeof users.$inferInsert;

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
    try {
        const userData: NewUser = await request.json();

        const [newUser] = await db.insert(users).values(userData).returning();

        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}

// GET /api/users?clerkId=xxx - Get user by clerk ID (query param)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const clerkId = searchParams.get('clerkId');

        if (!clerkId) {
            return NextResponse.json({ error: 'Clerk ID is required' }, { status: 400 });
        }

        const user = await db.query.users.findFirst({
            where: eq(users.clerkId, clerkId)
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
} 