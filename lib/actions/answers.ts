"use server";

import { db } from "@/db";
import { answers, questions, users, votes, interactions, notifications } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import {
    CreateAnswerParams,
    GetAnswersParams,
    AnswerVoteParams,
    DeleteAnswerParams,
} from "./shared.types";
import { notifyQuestionAuthor } from "./notifications";

export async function createAnswer(params: CreateAnswerParams) {
    try {
        const { content, authorId, questionId, path } = params;

        // Create the answer
        const [newAnswer] = await db
            .insert(answers)
            .values({
                content,
                authorId,
                questionId,
            })
            .returning();

        // Get question details for interaction and notification
        const question = await db.query.questions.findFirst({
            where: eq(questions.id, questionId),
            with: {
                author: true,
            }
        });

        if (question && question.author) {
            // Create interaction record
            await db.insert(interactions).values({
                userId: authorId,
                action: "answer",
                questionId,
                answerId: newAnswer.id,
            });

            // Get answer author details for notification
            const answerAuthor = await db.query.users.findFirst({
                where: eq(users.id, authorId)
            });

            // Check if a notification already exists for this answer
            const existingNotification = await db.query.notifications.findFirst({
                where: and(
                    eq(notifications.answerId, newAnswer.id),
                    eq(notifications.userId, question.authorId),
                    eq(notifications.type, "answer")
                ),
            });

            // Create notification for question author (if not self-answering and no existing notification)
            if (question.authorId !== authorId && answerAuthor && !existingNotification) {
                await db.insert(notifications).values({
                    userId: question.authorId,
                    type: "answer",
                    title: "New Answer to Your Question",
                    content: `${answerAuthor.name} answered your question: "${question.title}"`,
                    questionId,
                    answerId: newAnswer.id,
                });
            }
        }

        // Increase author's reputation +10 points for answering a question
        await db
            .update(users)
            .set({ reputation: sql`reputation + 10` })
            .where(eq(users.id, authorId));

        revalidatePath(path);
        return { success: true, answer: newAnswer };
    } catch (error) {
        console.error("Error creating answer:", error);
        return { success: false, error: "Failed to create answer" };
    }
}

export async function getAnswers(params: GetAnswersParams) {
    try {
        const { questionId, sortBy, page = 1, pageSize = 10 } = params;
        const skipAmount = (page - 1) * pageSize;

        let orderBy;
        switch (sortBy) {
            case "highestUpvotes":
                orderBy = desc(sql<number>`(
                    SELECT COUNT(*) FROM ${votes} 
                    WHERE ${votes.answerId} = ${answers.id} 
                    AND ${votes.type} = 'upvote'
                )`);
                break;
            case "lowestUpvotes":
                orderBy = asc(sql<number>`(
                    SELECT COUNT(*) FROM ${votes} 
                    WHERE ${votes.answerId} = ${answers.id} 
                    AND ${votes.type} = 'upvote'
                )`);
                break;
            case "recent":
                orderBy = desc(answers.createdAt);
                break;
            case "old":
                orderBy = asc(answers.createdAt);
                break;
            default:
                orderBy = desc(answers.createdAt);
                break;
        }

        const results = await db
            .select({
                id: answers.id,
                content: answers.content,
                authorId: answers.authorId,
                questionId: answers.questionId,
                createdAt: answers.createdAt,
                author: {
                    id: users.id,
                    clerkId: users.clerkId,
                    name: users.name,
                    username: users.username,
                    picture: users.picture,
                    reputation: users.reputation,
                },
                upvoteCount: sql<number>`(
                    SELECT COUNT(*) FROM ${votes} 
                    WHERE ${votes.answerId} = ${answers.id} 
                    AND ${votes.type} = 'upvote'
                )`,
                downvoteCount: sql<number>`(
                    SELECT COUNT(*) FROM ${votes} 
                    WHERE ${votes.answerId} = ${answers.id} 
                    AND ${votes.type} = 'downvote'
                )`,
                totalVotes: sql<number>`(
                    SELECT COUNT(CASE WHEN ${votes.type} = 'upvote' THEN 1 END) - 
                           COUNT(CASE WHEN ${votes.type} = 'downvote' THEN 1 END)
                    FROM ${votes} 
                    WHERE ${votes.answerId} = ${answers.id}
                )`
            })
            .from(answers)
            .leftJoin(users, eq(answers.authorId, users.id))
            .where(eq(answers.questionId, questionId))
            .orderBy(orderBy)
            .limit(pageSize)
            .offset(skipAmount);

        const totalCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(answers)
            .where(eq(answers.questionId, questionId))
            .then((res) => res[0].count);

        const isNext = totalCount > skipAmount + results.length;

        return { answers: results, isNext };
    } catch (error) {
        console.error("Error getting answers:", error);
        throw error;
    }
}

export async function upvoteAnswer(params: AnswerVoteParams) {
    try {
        const { answerId, userId, hasupVoted, hasdownVoted, path } = params;

        const existingVote = await db.query.votes.findFirst({
            where: and(
                eq(votes.answerId, answerId),
                eq(votes.userId, userId)
            ),
        });

        if (hasupVoted) {
            // Remove upvote
            if (existingVote) {
                await db.delete(votes).where(eq(votes.id, existingVote.id));
            }
        } else if (hasdownVoted) {
            // Change downvote to upvote
            if (existingVote) {
                await db
                    .update(votes)
                    .set({ type: "upvote" })
                    .where(eq(votes.id, existingVote.id));
            }
        } else {
            // Add new upvote
            await db.insert(votes).values({
                userId,
                answerId,
                type: "upvote",
            });
        }

        // Update voter's reputation
        const reputationChange = hasupVoted ? -2 : 2;
        await db
            .update(users)
            .set({ reputation: sql`reputation + ${reputationChange}` })
            .where(eq(users.id, userId));

        // Update answer author's reputation
        const answer = await db.query.answers.findFirst({
            where: eq(answers.id, answerId),
        });

        if (answer) {
            const authorReputationChange = hasupVoted ? -10 : 10;
            await db
                .update(users)
                .set({ reputation: sql`reputation + ${authorReputationChange}` })
                .where(eq(users.id, answer.authorId));
        }

        revalidatePath(path);
    } catch (error) {
        console.error("Error upvoting answer:", error);
        throw error;
    }
}

export async function downvoteAnswer(params: AnswerVoteParams) {
    try {
        const { answerId, userId, hasupVoted, hasdownVoted, path } = params;

        const existingVote = await db.query.votes.findFirst({
            where: and(
                eq(votes.answerId, answerId),
                eq(votes.userId, userId)
            ),
        });

        if (hasdownVoted) {
            // Remove downvote
            if (existingVote) {
                await db.delete(votes).where(eq(votes.id, existingVote.id));
            }
        } else if (hasupVoted) {
            // Change upvote to downvote
            if (existingVote) {
                await db
                    .update(votes)
                    .set({ type: "downvote" })
                    .where(eq(votes.id, existingVote.id));
            }
        } else {
            // Add new downvote
            await db.insert(votes).values({
                userId,
                answerId,
                type: "downvote",
            });
        }

        // Update voter's reputation
        const reputationChange = hasdownVoted ? 2 : -2;
        await db
            .update(users)
            .set({ reputation: sql`reputation + ${reputationChange}` })
            .where(eq(users.id, userId));

        // Update answer author's reputation
        const answer = await db.query.answers.findFirst({
            where: eq(answers.id, answerId),
        });

        if (answer) {
            const authorReputationChange = hasdownVoted ? 10 : -10;
            await db
                .update(users)
                .set({ reputation: sql`reputation + ${authorReputationChange}` })
                .where(eq(users.id, answer.authorId));
        }

        revalidatePath(path);
    } catch (error) {
        console.error("Error downvoting answer:", error);
        throw error;
    }
}

export async function deleteAnswer(params: DeleteAnswerParams) {
    try {
        const { answerId, path } = params;

        // Check if answer exists
        const existingAnswer = await db.query.answers.findFirst({
            where: eq(answers.id, answerId),
        });

        if (!existingAnswer) {
            return { success: false, error: "Answer not found" };
        }

        // Delete related data first (foreign key constraints)
        await db.delete(votes).where(eq(votes.answerId, answerId));
        await db.delete(interactions).where(eq(interactions.answerId, answerId));

        // Delete the answer
        await db.delete(answers).where(eq(answers.id, answerId));

        revalidatePath(path);
        return { success: true };
    } catch (error) {
        console.error("Error deleting answer:", error);
        return { success: false, error: "Failed to delete answer" };
    }
}

