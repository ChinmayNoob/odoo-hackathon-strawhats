"use server";

import { db } from "@/db";
import { notifications, questions, answers, users, forums, forumMembers } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface CreateNotificationParams {
    userId: number;
    type: "answer" | "forum_question";
    title: string;
    content: string;
    questionId?: number;
    answerId?: number;
    forumId?: number;
}

interface GetNotificationsParams {
    userId: number;
    page?: number;
    pageSize?: number;
}

interface MarkNotificationReadParams {
    notificationId: number;
    userId: number;
    path: string;
}

// Create a new notification
export async function createNotification(params: CreateNotificationParams) {
    try {
        const { userId, type, title, content, questionId, answerId, forumId } = params;

        await db.insert(notifications).values({
            userId,
            type,
            title,
            content,
            questionId,
            answerId,
            forumId,
        });

        return { success: true };
    } catch (error) {
        console.error("Error creating notification:", error);
        return { success: false, error: "Failed to create notification" };
    }
}

// Get user's notifications with pagination
export async function getNotifications(params: GetNotificationsParams) {
    try {
        const { userId, page = 1, pageSize = 20 } = params;
        const skipAmount = (page - 1) * pageSize;

        const results = await db
            .select({
                id: notifications.id,
                type: notifications.type,
                title: notifications.title,
                content: notifications.content,
                questionId: notifications.questionId,
                answerId: notifications.answerId,
                forumId: notifications.forumId,
                isRead: notifications.isRead,
                createdAt: notifications.createdAt,
            })
            .from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(desc(notifications.createdAt))
            .limit(pageSize)
            .offset(skipAmount);

        const totalCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(notifications)
            .where(eq(notifications.userId, userId))
            .then((res) => res[0].count);

        const isNext = totalCount > skipAmount + results.length;

        return { notifications: results, isNext };
    } catch (error) {
        console.error("Error getting notifications:", error);
        throw error;
    }
}

// Mark a notification as read
export async function markNotificationRead(params: MarkNotificationReadParams) {
    try {
        const { notificationId, userId, path } = params;

        await db
            .update(notifications)
            .set({ isRead: true })
            .where(
                and(
                    eq(notifications.id, notificationId),
                    eq(notifications.userId, userId)
                )
            );

        revalidatePath(path);
        return { success: true };
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return { success: false, error: "Failed to mark notification as read" };
    }
}

// Get unread notification count
export async function getUnreadCount(userId: number) {
    try {
        const [result] = await db
            .select({ count: sql<number>`count(*)` })
            .from(notifications)
            .where(
                and(
                    eq(notifications.userId, userId),
                    eq(notifications.isRead, false)
                )
            );

        return result.count;
    } catch (error) {
        console.error("Error getting unread count:", error);
        return 0;
    }
}

// Create notification for new answer
export async function notifyQuestionAuthor(questionId: number, answerId: number) {
    try {
        const question = await db.query.questions.findFirst({
            where: eq(questions.id, questionId),
            with: {
                author: true,
            },
        });

        if (!question?.author) return;

        const answer = await db.query.answers.findFirst({
            where: eq(answers.id, answerId),
            with: {
                author: true,
            },
        });

        if (!answer?.author) return;

        await createNotification({
            userId: question.authorId,
            type: "answer",
            title: "New Answer to Your Question",
            content: `${answer.author.name} answered your question: "${question.title}"`,
            questionId,
            answerId,
        });

    } catch (error) {
        console.error("Error notifying question author:", error);
    }
}

// Create notifications for forum members when new question is posted
export async function notifyForumMembers(questionId: number, forumId: number) {
    try {
        const question = await db.query.questions.findFirst({
            where: eq(questions.id, questionId),
            with: {
                author: true,
            },
        });

        if (!question?.author) return;

        const forum = await db.query.forums.findFirst({
            where: eq(forums.id, forumId),
        });

        if (!forum) return;

        // Get all forum members except the question author
        const members = await db
            .select({
                userId: forumMembers.userId,
            })
            .from(forumMembers)
            .where(
                and(
                    eq(forumMembers.forumId, forumId),
                    sql`${forumMembers.userId} != ${question.authorId}`
                )
            );

        // Create notifications for each member
        for (const member of members) {
            await createNotification({
                userId: member.userId,
                type: "forum_question",
                title: "New Question in Forum",
                content: `${question.author.name} posted a new question in ${forum.name}: "${question.title}"`,
                questionId,
                forumId,
            });
        }

    } catch (error) {
        console.error("Error notifying forum members:", error);
    }
} 