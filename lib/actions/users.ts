"use server";


import { eq, desc, asc, and, or, ilike, sql } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { users, savedQuestions, questions, questionTags, tags, votes, answers } from "@/db/schema";
import { db } from "@/db";
import { revalidatePath } from "next/cache";
import { GetSavedQuestionsParams, GetUserStatsParams, ToggleSaveQuestionParams, GetAllUsersParams } from "./shared.types";

export type NewUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Create a new user
export async function createUser(userData: NewUser) {
    try {
        const [newUser] = await db.insert(users).values(userData).returning();
        return { success: true, user: newUser };
    } catch (error) {
        console.error("Error creating user:", error);
        return { success: false, error: "Failed to create user" };
    }
}

// Get user by ID
export async function getUserById(id: number) {
    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, id)
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        return { success: true, user };
    } catch (error) {
        console.error("Error fetching user:", error);
        return { success: false, error: "Failed to fetch user" };
    }
}

// Get user by Clerk ID
export async function getUserByClerkId(clerkId: string) {
    try {
        const user = await db.query.users.findFirst({
            where: eq(users.clerkId, clerkId)
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        return { success: true, user };
    } catch (error) {
        console.error("Error fetching user:", error);
        return { success: false, error: "Failed to fetch user" };
    }
}

// Update user by ID
export async function updateUserById(id: number, updateData: Partial<Omit<NewUser, 'id' | 'clerkId'>>) {
    try {
        const [updatedUser] = await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, id))
            .returning();

        if (!updatedUser) {
            return { success: false, error: "User not found" };
        }

        return { success: true, user: updatedUser };
    } catch (error) {
        console.error("Error updating user:", error);
        return { success: false, error: "Failed to update user" };
    }
}

// Delete user by ID
export async function deleteUserById(id: number) {
    try {
        const [deletedUser] = await db
            .delete(users)
            .where(eq(users.id, id))
            .returning();

        if (!deletedUser) {
            return { success: false, error: "User not found" };
        }

        return { success: true, user: deletedUser };
    } catch (error) {
        console.error("Error deleting user:", error);
        return { success: false, error: "Failed to delete user" };
    }
}

// Create or get user from Clerk data (for automatic user creation on login)
export async function createOrGetUserFromClerk() {
    try {
        const clerkUser = await currentUser();

        if (!clerkUser) {
            return { success: false, error: "No authenticated user found" };
        }

        // Try to get existing user first
        const existingUser = await getUserByClerkId(clerkUser.id);

        if (existingUser.success) {
            return existingUser;
        }

        // If user doesn't exist, create new user from Clerk data
        const newUserData: NewUser = {
            clerkId: clerkUser.id,
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.username || 'Unknown',
            username: clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress.split('@')[0] || 'user',
            email: clerkUser.emailAddresses[0]?.emailAddress || '',
            picture: clerkUser.imageUrl || '',
            bio: null,
            location: null,
            portfolioProfile: null,
            password: null, // Not needed for Clerk users
        };

        return await createUser(newUserData);
    } catch (error) {
        console.error("Error creating/getting user from Clerk:", error);
        return { success: false, error: "Failed to create/get user" };
    }
}

// Update user by Clerk ID - for profile updates
export async function updateUser({
    clerkId,
    updateData,
    path,
}: {
    clerkId: string;
    updateData: {
        name?: string;
        username?: string;
        portfolioProfile?: string;
        location?: string;
        bio?: string;
    };
    path: string;
}) {
    try {
        // First get the user by clerkId to get their numeric ID
        const userResult = await getUserByClerkId(clerkId);

        if (!userResult.success) {
            throw new Error("User not found");
        }

        // Update the user using their numeric ID
        const result = await updateUserById(userResult.user!.id, updateData);

        if (!result.success) {
            throw new Error(result.error || "Failed to update user");
        }

        // Revalidate the path to refresh the data
        revalidatePath(path);

        return result;
    } catch (error) {
        console.error("Error updating user:", error);
        throw error;
    }
}

// Get user info by userId (clerkId) - with actual question and answer counts
export async function getUserInfo(params: { userId: string }) {
    try {
        const { userId } = params;

        // First, ensure the user exists in our database
        await ensureUserExists(userId);

        const user = await db.query.users.findFirst({
            where: eq(users.clerkId, userId)
        });

        if (!user) {
            throw new Error("User not found");
        }

        // Get actual question count
        const questionCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(questions)
            .where(eq(questions.authorId, user.id))
            .then((res) => res[0].count);

        // Get actual answer count
        const answerCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(answers)
            .where(eq(answers.authorId, user.id))
            .then((res) => res[0].count);

        const badgeCounts = {
            GOLD: 0,
            SILVER: 0,
            BRONZE: 0
        };

        return {
            user,
            totalQuestions: questionCount,
            totalAnswers: answerCount,
            reputation: user.reputation || 0,
            badgeCounts
        };
    } catch (error) {
        console.error("Error fetching user info:", error);
        throw error;
    }
}

// Helper function to ensure user exists in database
export async function ensureUserExists(clerkId: string) {
    try {
        // Check if user already exists
        const existingUser = await getUserByClerkId(clerkId);

        if (existingUser.success) {
            return existingUser;
        }

        // If user doesn't exist, create them
        console.log("User not found in database, creating from Clerk data...");
        const result = await createOrGetUserFromClerk();

        if (!result.success) {
            console.error("Failed to create user:", result.error);
        }

        return result;
    } catch (error) {
        console.error("Error ensuring user exists:", error);
        return { success: false, error: "Failed to ensure user exists" };
    }
}

// Toggle save question for a user
export async function toggleSaveQuestion(params: ToggleSaveQuestionParams) {
    try {
        const { userId, questionId, path } = params;

        // Get user by clerkId to get internal user ID
        const userResult = await getUserByClerkId(userId.toString());
        if (!userResult.success) {
            throw new Error("User not found");
        }
        const internalUserId = userResult.user!.id;

        // Check if question is already saved
        const existingSave = await db.query.savedQuestions.findFirst({
            where: and(
                eq(savedQuestions.userId, internalUserId),
                eq(savedQuestions.questionId, questionId)
            ),
        });

        if (existingSave) {
            // Remove from saved questions
            await db.delete(savedQuestions).where(
                and(
                    eq(savedQuestions.userId, internalUserId),
                    eq(savedQuestions.questionId, questionId)
                )
            );
        } else {
            // Add to saved questions
            await db.insert(savedQuestions).values({
                userId: internalUserId,
                questionId,
            });
        }

        revalidatePath(path);
        return { success: true, saved: !existingSave };
    } catch (error) {
        console.error("Error toggling save question:", error);
        throw error;
    }
}

// Check if a question is saved by user
export async function checkIsQuestionSaved(clerkId: string, questionId: number): Promise<boolean> {
    try {
        // Get user by clerkId to get internal user ID
        const userResult = await getUserByClerkId(clerkId);
        if (!userResult.success) {
            return false;
        }
        const internalUserId = userResult.user!.id;

        const savedQuestion = await db.query.savedQuestions.findFirst({
            where: and(
                eq(savedQuestions.userId, internalUserId),
                eq(savedQuestions.questionId, questionId)
            ),
        });

        return !!savedQuestion;
    } catch (error) {
        console.error("Error checking if question is saved:", error);
        return false;
    }
}

// Get saved questions for a user
export async function getSavedQuestions(params: GetSavedQuestionsParams) {
    try {
        const { clerkId, searchQuery, filter, page = 1, pageSize = 20 } = params;
        const skipAmount = (page - 1) * pageSize;

        // Get user by clerkId to get internal user ID
        const userResult = await getUserByClerkId(clerkId);
        if (!userResult.success) {
            throw new Error("User not found");
        }
        const internalUserId = userResult.user!.id;

        // Build search conditions
        const searchConditions = [];
        if (searchQuery) {
            searchConditions.push(
                or(
                    ilike(questions.title, `%${searchQuery}%`),
                    ilike(questions.content, `%${searchQuery}%`)
                )
            );
        }

        // Build sort conditions
        let orderBy;
        switch (filter) {
            case "most_recent":
                orderBy = desc(savedQuestions.savedAt);
                break;
            case "oldest":
                orderBy = asc(savedQuestions.savedAt);
                break;
            case "most_voted":
                orderBy = desc(sql<number>`(
                    SELECT COUNT(CASE WHEN ${votes.type} = 'upvote' THEN 1 END) - 
                           COUNT(CASE WHEN ${votes.type} = 'downvote' THEN 1 END)
                    FROM ${votes} 
                    WHERE ${votes.questionId} = ${questions.id}
                )`);
                break;
            case "most_viewed":
                orderBy = desc(questions.views);
                break;
            case "most_answered":
                orderBy = desc(sql<number>`(
                    SELECT COUNT(*) FROM ${answers} 
                    WHERE ${answers.questionId} = ${questions.id}
                )`);
                break;
            default:
                orderBy = desc(savedQuestions.savedAt);
                break;
        }

        // Combine all conditions
        const allConditions = and(
            eq(savedQuestions.userId, internalUserId),
            ...(searchConditions.length > 0 ? searchConditions : [])
        );

        const results = await db
            .select({
                id: questions.id,
                title: questions.title,
                content: questions.content,
                views: questions.views,
                authorId: questions.authorId,
                createdAt: questions.createdAt,
                savedAt: savedQuestions.savedAt,
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
            .from(savedQuestions)
            .leftJoin(questions, eq(savedQuestions.questionId, questions.id))
            .leftJoin(users, eq(questions.authorId, users.id))
            .where(allConditions)
            .orderBy(orderBy)
            .limit(pageSize + 1)
            .offset(skipAmount);

        const isNext = results.length > pageSize;
        if (isNext) {
            results.pop();
        }

        return { questions: results, isNext };
    } catch (error) {
        console.error("Error getting saved questions:", error);
        throw error;
    }
}

// Get questions created by a user
export async function getUserQuestions(params: GetUserStatsParams) {
    try {
        const { clerkId, page = 1, pageSize = 10 } = params;
        const skipAmount = (page - 1) * pageSize;

        // Get user by clerkId to get internal user ID
        const userResult = await getUserByClerkId(clerkId);
        if (!userResult.success) {
            throw new Error("User not found");
        }
        const internalUserId = userResult.user!.id;

        // Get total count
        const totalQuestions = await db
            .select({ count: sql<number>`count(*)` })
            .from(questions)
            .where(eq(questions.authorId, internalUserId))
            .then((res) => res[0].count);

        // Get questions with all related data
        const userQuestions = await db
            .select({
                id: questions.id,
                title: questions.title,
                content: questions.content,
                views: questions.views,
                authorId: questions.authorId,
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
            .where(eq(questions.authorId, internalUserId))
            .orderBy(desc(questions.createdAt), desc(questions.views), desc(sql<number>`(
                SELECT COUNT(CASE WHEN ${votes.type} = 'upvote' THEN 1 END) - 
                       COUNT(CASE WHEN ${votes.type} = 'downvote' THEN 1 END)
                FROM ${votes} 
                WHERE ${votes.questionId} = ${questions.id}
            )`))
            .limit(pageSize)
            .offset(skipAmount);

        const isNextQuestion = totalQuestions > skipAmount + userQuestions.length;

        return { totalQuestions, userQuestions, isNextQuestion };
    } catch (error) {
        console.error("Error getting user questions:", error);
        throw error;
    }
}

// Get answers created by a user
export async function getUserAnswers(params: GetUserStatsParams) {
    try {
        const { clerkId, page = 1, pageSize = 10 } = params;
        const skipAmount = (page - 1) * pageSize;

        // Get user by clerkId to get internal user ID
        const userResult = await getUserByClerkId(clerkId);
        if (!userResult.success) {
            throw new Error("User not found");
        }
        const internalUserId = userResult.user!.id;

        // Get total count
        const totalAnswers = await db
            .select({ count: sql<number>`count(*)` })
            .from(answers)
            .where(eq(answers.authorId, internalUserId))
            .then((res) => res[0].count);

        // Get answers with related data
        const userAnswers = await db
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
                    email: users.email,
                    picture: users.picture,
                    reputation: users.reputation,
                    portfolioProfile: users.portfolioProfile,
                },
                question: {
                    id: questions.id,
                    title: questions.title,
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
            .leftJoin(questions, eq(answers.questionId, questions.id))
            .where(eq(answers.authorId, internalUserId))
            .orderBy(desc(answers.createdAt), desc(sql<number>`(
                SELECT COUNT(CASE WHEN ${votes.type} = 'upvote' THEN 1 END) - 
                       COUNT(CASE WHEN ${votes.type} = 'downvote' THEN 1 END)
                FROM ${votes} 
                WHERE ${votes.answerId} = ${answers.id}
            )`))
            .limit(pageSize)
            .offset(skipAmount);

        const isNextAnswer = totalAnswers > skipAmount + userAnswers.length;

        return { totalAnswers, userAnswers, isNextAnswer };
    } catch (error) {
        console.error("Error getting user answers:", error);
        throw error;
    }
}

// Get all users with pagination, filtering, and search
export async function getAllUsers(params: GetAllUsersParams) {
    try {
        const { page = 1, pageSize = 9, filter, searchQuery } = params;
        const skipAmount = (page - 1) * pageSize;

        // Build search conditions
        const searchConditions = [];
        if (searchQuery) {
            searchConditions.push(
                or(
                    ilike(users.name, `%${searchQuery}%`),
                    ilike(users.username, `%${searchQuery}%`)
                )
            );
        }

        // Build sort conditions
        let orderBy;
        switch (filter) {
            case "new_users":
                orderBy = desc(users.joinedAt);
                break;
            case "old_users":
                orderBy = asc(users.joinedAt);
                break;
            case "top_contributors":
                orderBy = desc(users.reputation);
                break;
            default:
                orderBy = desc(users.joinedAt);
                break;
        }

        // Combine all conditions
        const allConditions = searchConditions.length > 0 ? and(...searchConditions) : undefined;

        // Get users with stats
        const allUsers = await db
            .select({
                id: users.id,
                clerkId: users.clerkId,
                name: users.name,
                username: users.username,
                email: users.email,
                picture: users.picture,
                bio: users.bio,
                location: users.location,
                portfolioProfile: users.portfolioProfile,
                reputation: users.reputation,
                joinedAt: users.joinedAt,
                totalQuestions: sql<number>`(
                    SELECT COUNT(*) FROM ${questions} 
                    WHERE ${questions.authorId} = ${users.id}
                )`,
                totalAnswers: sql<number>`(
                    SELECT COUNT(*) FROM ${answers} 
                    WHERE ${answers.authorId} = ${users.id}
                )`
            })
            .from(users)
            .where(allConditions)
            .orderBy(orderBy)
            .limit(pageSize + 1)
            .offset(skipAmount);

        const isNext = allUsers.length > pageSize;
        if (isNext) {
            allUsers.pop();
        }

        return { users: allUsers, isNext };
    } catch (error) {
        console.error("Error getting all users:", error);
        throw error;
    }
} 