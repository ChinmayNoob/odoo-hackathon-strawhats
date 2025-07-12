import { db } from "@/db";
import { votes } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { questionId, answerId, userId } = await request.json();

        if (!userId || (!questionId && !answerId)) {
            return NextResponse.json({ error: "Missing userId and either questionId or answerId" }, { status: 400 });
        }

        let existingVote;

        if (questionId) {
            // Check if user has voted on this question
            existingVote = await db.query.votes.findFirst({
                where: and(
                    eq(votes.questionId, questionId),
                    eq(votes.userId, userId)
                ),
            });
        } else if (answerId) {
            // Check if user has voted on this answer
            existingVote = await db.query.votes.findFirst({
                where: and(
                    eq(votes.answerId, answerId),
                    eq(votes.userId, userId)
                ),
            });
        }

        return NextResponse.json({ vote: existingVote });
    } catch (error) {
        console.error("Error checking vote:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
} 