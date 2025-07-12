"use server";

import { db } from "@/db";
import { questions, interactions } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { ViewQuestionParams } from "./shared.types";

export async function viewQuestion(params: ViewQuestionParams) {
    try {
        const { questionId, userId } = params;
        // Update view count for the question, handling null values
        await db
            .update(questions)
            .set({
                views: sql`COALESCE(${questions.views}, 0) + 1`
            })
            .where(eq(questions.id, questionId));

        if (userId) {
            // Check if user has already viewed this question
            const existingInteraction = await db.query.interactions.findFirst({
                where: and(
                    eq(interactions.userId, userId),
                    eq(interactions.action, "view"),
                    eq(interactions.questionId, questionId)
                ),
            });

            if (existingInteraction) {
                console.log("User has already viewed this question");
                return { success: true, message: "View already recorded" };
            }

            // Create new interaction record
            await db.insert(interactions).values({
                userId,
                action: "view",
                questionId,
            });
        }

        return { success: true, message: "Question view recorded" };
    } catch (error) {
        console.error("Error recording question view:", error);
        throw error;
    }
} 