"use server";
import { db } from "@/db";
import { forums, forumMembers, questions, users, tags, questionTags, interactions, votes, answers } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
    CreateforumParams,
    EditforumParams,
    DeleteforumParams,
    JoinforumParams,
    LeaveforumParams,
    GetforumByIdParams,
    GetAllforumsParams,
    GetforumQuestionsParams,
    GetUserforumsParams,
    AskQuestionInforumParams,
    forumWithStats,
    GetforumMembersParams,
} from "./shared.types";

export async function createforum(params: CreateforumParams) {
    try {
        const { name, slug, description, picture, creatorId, path } = params;

        // Check if slug already exists
        const existingforum = await db.query.forums.findFirst({
            where: or(
                eq(forums.slug, slug),
                eq(forums.name, name)
            ),
        });

        if (existingforum) {
            return { success: false, error: "forum with this name or slug already exists" };
        }

        // Create the forum
        const [newforum] = await db
            .insert(forums)
            .values({
                name,
                slug,
                description,
                picture,
            })
            .returning();

        // Add creator as the first member with admin role
        await db.insert(forumMembers).values({
            forumId: newforum.id,
            userId: creatorId,
            role: "admin",
        });

        // Create interaction record
        await db.insert(interactions).values({
            userId: creatorId,
            action: "create-forum",
        });

        // Increase creator's reputation
        await db
            .update(users)
            .set({ reputation: sql`reputation + 20` })
            .where(eq(users.id, creatorId));

        revalidatePath(path);
        revalidatePath("/forums");
        return { success: true, forum: newforum };
    } catch (error) {
        console.error("Error creating forum:", error);
        return { success: false, error: "Failed to create forum" };
    }
}

// Edit an existing forum
export async function editforum(params: EditforumParams) {
    try {
        const { forumId, name, description, picture, userId, path } = params;

        // Check if forum exists
        const existingforum = await db.query.forums.findFirst({
            where: eq(forums.id, forumId),
        });

        if (!existingforum) {
            return { success: false, error: "forum not found" };
        }

        // Check if user is admin of the forum
        const membership = await db.query.forumMembers.findFirst({
            where: and(
                eq(forumMembers.forumId, forumId),
                eq(forumMembers.userId, userId)
            ),
        });

        if (!membership || membership.role !== "admin") {
            return { success: false, error: "Unauthorized: Only admins can edit this forum" };
        }

        // Update the forum
        await db
            .update(forums)
            .set({
                name: name || existingforum.name,
                description: description || existingforum.description,
                picture: picture || existingforum.picture,
            })
            .where(eq(forums.id, forumId));

        revalidatePath(path);
        return { success: true };
    } catch (error) {
        console.error("Error editing forum:", error);
        return { success: false, error: "Failed to edit forum" };
    }
}


// Delete a forum
export async function deleteforum(params: DeleteforumParams) {
    try {
        const { forumId, userId, path } = params;

        // Check if forum exists
        const existingforum = await db.query.forums.findFirst({
            where: eq(forums.id, forumId),
        });

        if (!existingforum) {
            return { success: false, error: "forum not found" };
        }

        // Check if user is admin of the forum
        const membership = await db.query.forumMembers.findFirst({
            where: and(
                eq(forumMembers.forumId, forumId),
                eq(forumMembers.userId, userId)
            ),
        });

        if (!membership || membership.role !== "admin") {
            return { success: false, error: "Unauthorized: Only admins can delete this forum" };
        }

        // Delete related data first (foreign key constraints)
        // Note: Questions in the forum will have their forumId set to null due to cascade
        await db.delete(forumMembers).where(eq(forumMembers.forumId, forumId));
        await db.delete(forums).where(eq(forums.id, forumId));

        revalidatePath(path);
        revalidatePath("/forums");
        return { success: true };
    } catch (error) {
        console.error("Error deleting forum:", error);
        return { success: false, error: "Failed to delete forum" };
    }
}

// Join a forum
export async function joinforum(params: JoinforumParams) {
    try {
        const { forumId, userId, path } = params;

        // Check if forum exists
        const existingforum = await db.query.forums.findFirst({
            where: eq(forums.id, forumId),
        });

        if (!existingforum) {
            return { success: false, error: "forum not found" };
        }

        // Check if user is already a member
        const existingMembership = await db.query.forumMembers.findFirst({
            where: and(
                eq(forumMembers.forumId, forumId),
                eq(forumMembers.userId, userId)
            ),
        });

        if (existingMembership) {
            return { success: false, error: "You are already a member of this forum" };
        }

        // Add user as member
        await db.insert(forumMembers).values({
            forumId,
            userId,
            role: "member",
        });

        // Create interaction record
        await db.insert(interactions).values({
            userId,
            action: "join-forum",
        });

        // Small reputation boost for joining
        await db
            .update(users)
            .set({ reputation: sql`reputation + 2` })
            .where(eq(users.id, userId));

        revalidatePath(path);
        return { success: true };
    } catch (error) {
        console.error("Error joining forum:", error);
        return { success: false, error: "Failed to join forum" };
    }
}

// leave a forum
export async function leaveforum(params: LeaveforumParams) {
    try {
        const { forumId, userId, path } = params;

        // Check if user is a member
        const membership = await db.query.forumMembers.findFirst({
            where: and(
                eq(forumMembers.forumId, forumId),
                eq(forumMembers.userId, userId)
            ),
        });

        if (!membership) {
            return { success: false, error: "You are not a member of this forum" };
        }

        // Don't allow the last admin to leave
        if (membership.role === "admin") {
            const adminCount = await db
                .select({ count: sql<number>`count(*)` })
                .from(forumMembers)
                .where(and(
                    eq(forumMembers.forumId, forumId),
                    eq(forumMembers.role, "admin")
                ))
                .then((res) => res[0].count);

            if (adminCount <= 1) {
                return { success: false, error: "Cannot leave: You are the last admin of this forum" };
            }
        }

        // Remove membership
        await db.delete(forumMembers).where(and(
            eq(forumMembers.forumId, forumId),
            eq(forumMembers.userId, userId)
        ));

        revalidatePath(path);
        return { success: true };
    } catch (error) {
        console.error("Error leaving forum:", error);
        return { success: false, error: "Failed to leave forum" };
    }
}

// Get forum by ID with stats
export async function getforumById(params: GetforumByIdParams): Promise<forumWithStats> {
    try {
        const { forumId } = params;

        const [forum] = await db
            .select({
                id: forums.id,
                name: forums.name,
                slug: forums.slug,
                description: forums.description,
                picture: forums.picture,
                createdAt: forums.createdOn,
                memberCount: sql<number>`(
                    SELECT COUNT(*) FROM ${forumMembers} 
                    WHERE ${forumMembers.forumId} = ${forums.id}
                )`,
                questionCount: sql<number>`(
                    SELECT COUNT(*) FROM ${questions} 
                    WHERE ${questions.forumId} = ${forums.id}
                )`,
            })
            .from(forums)
            .where(eq(forums.id, forumId));

        if (!forum) {
            throw new Error("forum not found");
        }

        return forum;
    } catch (error) {
        console.error("Error getting forum:", error);
        throw error;
    }
}

// Get all forums with pagination and search
export async function getAllforums(params: GetAllforumsParams) {
    try {
        const { searchQuery, page = 1, pageSize = 20, filter = "newest" } = params;
        const skipAmount = (page - 1) * pageSize;

        const conditions = [];
        if (searchQuery) {
            conditions.push(
                or(
                    ilike(forums.name, `%${searchQuery}%`),
                    ilike(forums.description, `%${searchQuery}%`)
                )
            );
        }

        let orderBy;
        switch (filter) {
            case "newest":
                orderBy = desc(forums.createdOn);
                break;
            case "popular":
                orderBy = desc(sql<number>`(
                    SELECT COUNT(*) FROM ${forumMembers} 
                    WHERE ${forumMembers.forumId} = ${forums.id}
                )`);
                break;
            case "active":
                orderBy = desc(sql<number>`(
                    SELECT COUNT(*) FROM ${questions} 
                    WHERE ${questions.forumId} = ${forums.id}
                )`);
                break;
            default:
                orderBy = desc(forums.createdOn);
                break;
        }

        const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

        const forumsWithStats = await db
            .select({
                id: forums.id,
                name: forums.name,
                slug: forums.slug,
                description: forums.description,
                picture: forums.picture,
                createdAt: forums.createdOn,
                memberCount: sql<number>`(
                    SELECT COUNT(*) FROM ${forumMembers} 
                    WHERE ${forumMembers.forumId} = ${forums.id}
                )`,
                questionCount: sql<number>`(
                    SELECT COUNT(*) FROM ${questions} 
                    WHERE ${questions.forumId} = ${forums.id}
                )`,
            })
            .from(forums)
            .where(whereCondition)
            .orderBy(orderBy)
            .limit(pageSize)
            .offset(skipAmount);

        const totalCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(forums)
            .where(whereCondition)
            .then((res) => res[0].count);

        const isNext = totalCount > skipAmount + forumsWithStats.length;

        return { forums: forumsWithStats, isNext };
    } catch (error) {
        console.error("Error getting all forums:", error);
        throw error;
    }
}

// Get questions in a specific forum
export async function getforumQuestions(params: GetforumQuestionsParams) {
    try {
        const { forumId, searchQuery, filter = "newest", page = 1, pageSize = 20 } = params;
        const skipAmount = (page - 1) * pageSize;

        const conditions = [eq(questions.forumId, forumId)];
        if (searchQuery) {
            conditions.push(
                ilike(questions.title, `%${searchQuery}%`),
                ilike(questions.content, `%${searchQuery}%`)
            );
        }

        let orderBy = desc(questions.createdAt);
        const additionalConditions = [];

        switch (filter) {
            case "newest":
                orderBy = desc(questions.createdAt);
                break;
            case "frequent":
                orderBy = desc(questions.views);
                break;
            case "unanswered":
                additionalConditions.push(
                    sql`NOT EXISTS (
                        SELECT 1 FROM ${answers}
                        WHERE ${answers.questionId} = ${questions.id}
                    )`
                );
                orderBy = desc(questions.createdAt);
                break;
        }

        const allConditions = and(...conditions, ...additionalConditions);

        const results = await db
            .select({
                id: questions.id,
                title: questions.title,
                content: questions.content,
                views: questions.views,
                authorId: questions.authorId,
                forumId: questions.forumId,
                createdAt: questions.createdAt,
                author: {
                    id: users.id,
                    clerkId: users.clerkId,
                    name: users.name,
                    username: users.username,
                    email: users.email,
                    picture: users.picture,
                    reputation: users.reputation,
                    portfolioProfile: users.portfolioProfile,
                },
                tags: sql<Array<{ id: number; name: string; description: string }>>`(
                    SELECT COALESCE(
                        json_agg(
                            json_build_object(
                                'id', ${tags.id},
                                'name', ${tags.name},
                                'description', ${tags.description}
                            )
                        ) FILTER (WHERE ${tags.id} IS NOT NULL),
                        '[]'::json
                    )
                    FROM ${questionTags}
                    LEFT JOIN ${tags} ON ${questionTags.tagId} = ${tags.id}
                    WHERE ${questionTags.questionId} = ${questions.id}
                )`,
                upvoteCount: sql<number>`(
                    SELECT COUNT(*) FROM ${votes} 
                    WHERE ${votes.questionId} = ${questions.id} 
                    AND ${votes.type} = 'upvote'
                )`,
                downvoteCount: sql<number>`(
                    SELECT COUNT(*) FROM ${votes} 
                    WHERE ${votes.questionId} = ${questions.id} 
                    AND ${votes.type} = 'downvote'
                )`,
                totalVotes: sql<number>`(
                    SELECT COUNT(CASE WHEN ${votes.type} = 'upvote' THEN 1 END) - 
                           COUNT(CASE WHEN ${votes.type} = 'downvote' THEN 1 END)
                    FROM ${votes} 
                    WHERE ${votes.questionId} = ${questions.id}
                )`,
                answerCount: sql<number>`(
                    SELECT COUNT(*) FROM ${answers} 
                    WHERE ${answers.questionId} = ${questions.id}
                )`
            })
            .from(questions)
            .leftJoin(users, eq(questions.authorId, users.id))
            .where(allConditions)
            .orderBy(orderBy)
            .limit(pageSize)
            .offset(skipAmount);

        const totalCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(questions)
            .where(allConditions)
            .then((res) => res[0].count);

        const isNext = totalCount > skipAmount + results.length;

        return { questions: results, isNext };
    } catch (error) {
        console.error("Error getting forum questions:", error);
        throw error;
    }
}

// Get user's joined forums
export async function getUserforums(params: GetUserforumsParams) {
    try {
        const { userId, page = 1, pageSize = 20 } = params;
        const skipAmount = (page - 1) * pageSize;

        const userforums = await db
            .select({
                id: forums.id,
                name: forums.name,
                slug: forums.slug,
                description: forums.description,
                picture: forums.picture,
                createdAt: forums.createdOn,
                role: forumMembers.role,
                joinedAt: forumMembers.joinedAt,
                memberCount: sql<number>`(
                    SELECT COUNT(*) FROM ${forumMembers} lm
                    WHERE lm.forum_id = ${forums.id}
                )`,
                questionCount: sql<number>`(
                    SELECT COUNT(*) FROM ${questions} 
                    WHERE ${questions.forumId} = ${forums.id}
                )`,
            })
            .from(forumMembers)
            .innerJoin(forums, eq(forumMembers.forumId, forums.id))
            .where(eq(forumMembers.userId, userId))
            .orderBy(desc(forumMembers.joinedAt))
            .limit(pageSize)
            .offset(skipAmount);

        const totalCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(forumMembers)
            .where(eq(forumMembers.userId, userId))
            .then((res) => res[0].count);

        const isNext = totalCount > skipAmount + userforums.length;

        return { forums: userforums, isNext };
    } catch (error) {
        console.error("Error getting user forums:", error);
        throw error;
    }
}

// Ask a question in a forum
export async function askQuestionInforum(params: AskQuestionInforumParams) {
    try {
        const { title, content, tags: tagNames, authorId, forumId, path } = params;

        // Check if user is a member of the forum
        if (!forumId) throw new Error("forum ID is required");

        const membership = await db.query.forumMembers.findFirst({
            where: and(
                eq(forumMembers.forumId, forumId),
                eq(forumMembers.userId, authorId)
            ),
        });

        if (!membership) {
            return { success: false, error: "You must be a member of this forum to ask questions" };
        }

        // Create the question
        const [question] = await db
            .insert(questions)
            .values({
                title,
                content,
                authorId,
                forumId,
            })
            .returning();

        // Create or get tags and create question-tag relations
        for (const tagName of tagNames) {
            const normalizedTagName = tagName.toUpperCase().trim();

            let tag = await db.query.tags.findFirst({
                where: eq(tags.name, normalizedTagName),
            });

            if (!tag) {
                const [createdTag] = await db
                    .insert(tags)
                    .values({
                        name: normalizedTagName,
                        description: `Questions about ${normalizedTagName}`,
                    })
                    .returning();
                tag = createdTag;
            }

            await db.insert(questionTags).values({
                questionId: question.id,
                tagId: tag.id,
            });
        }

        // Create interaction record
        await db.insert(interactions).values({
            userId: authorId,
            questionId: question.id,
            action: "ask-question",
        });

        // Increment author reputation
        await db
            .update(users)
            .set({ reputation: sql`reputation + 5` })
            .where(eq(users.id, authorId));

        revalidatePath(path);
        return { success: true, question };
    } catch (error) {
        console.error("Error asking question in forum:", error);
        return { success: false, error: "Failed to ask question in forum" };
    }
}

// Get forum members
export async function getforumMembers(params: GetforumMembersParams) {
    try {
        const { forumId, page = 1, pageSize = 20, filter = "all" } = params;
        const skipAmount = (page - 1) * pageSize;

        let orderBy;
        const whereConditions = [eq(forumMembers.forumId, forumId)];

        switch (filter) {
            case "admin":
                whereConditions.push(eq(forumMembers.role, "admin"));
                orderBy = desc(forumMembers.joinedAt);
                break;
            case "recent":
                orderBy = desc(forumMembers.joinedAt);
                break;
            default: // "all"
                orderBy = desc(forumMembers.joinedAt);
                break;
        }

        const members = await db
            .select({
                id: users.id,
                clerkId: users.clerkId,
                name: users.name,
                username: users.username,
                picture: users.picture,
                reputation: users.reputation,
                role: forumMembers.role,
                joinedAt: forumMembers.joinedAt,
            })
            .from(forumMembers)
            .innerJoin(users, eq(forumMembers.userId, users.id))
            .where(and(...whereConditions))
            .orderBy(orderBy)
            .limit(pageSize)
            .offset(skipAmount);

        const totalCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(forumMembers)
            .where(and(...whereConditions))
            .then((res) => res[0].count);

        const isNext = totalCount > skipAmount + members.length;

        return { members, isNext };
    } catch (error) {
        console.error("Error getting forum members:", error);
        throw error;
    }
}

// Check if user is member of a forum
export async function isUserMemberOfforum(forumId: number, userId: number): Promise<boolean> {
    try {
        const membership = await db.query.forumMembers.findFirst({
            where: and(
                eq(forumMembers.forumId, forumId),
                eq(forumMembers.userId, userId)
            ),
        });

        return !!membership;
    } catch (error) {
        console.error("Error checking forum membership:", error);
        return false;
    }
}

// Get popular forums
export async function getPopularforums(limit: number = 10) {
    try {
        const popularforums = await db
            .select({
                id: forums.id,
                name: forums.name,
                slug: forums.slug,
                description: forums.description,
                picture: forums.picture,
                memberCount: sql<number>`(
                    SELECT COUNT(*) FROM ${forumMembers} 
                    WHERE ${forumMembers.forumId} = ${forums.id}
                )`,
            })
            .from(forums)
            .orderBy(desc(sql<number>`(
                SELECT COUNT(*) FROM ${forumMembers} 
                WHERE ${forumMembers.forumId} = ${forums.id}
            )`))
            .limit(limit);

        return popularforums;
    } catch (error) {
        console.error("Error getting popular forums:", error);
        throw error;
    }
}






