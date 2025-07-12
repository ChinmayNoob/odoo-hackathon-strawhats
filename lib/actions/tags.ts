"use server";

import { db } from "@/db";
import { tags, users, questions, questionTags, interactions, votes, answers, forums } from "@/db/schema";
import { asc, desc, eq, ilike, sql, and, inArray } from "drizzle-orm";
import {
    GetAllTagsParams,
    GetQuestionsByTagIdParams,
    GetTopInteractedTagsParams,
} from "./shared.types";

export async function getTopInteractedTags(params: GetTopInteractedTagsParams) {
    try {
        const { userId, limit = 2 } = params;

        // Check if user exists
        const user = await db.query.users.findFirst({
            where: eq(users.id, userId),
        });

        if (!user) {
            throw new Error("User not found");
        }

        // Get tags from user interactions
        const userInteractionTags = await db
            .selectDistinct({
                tagId: interactions.tagId,
            })
            .from(interactions)
            .where(
                and(
                    eq(interactions.userId, userId),
                    sql`${interactions.tagId} IS NOT NULL`
                )
            );

        const tagIds = userInteractionTags
            .map(interaction => interaction.tagId)
            .filter((id): id is number => id !== null);

        if (tagIds.length === 0) {
            return [];
        }

        // Get the actual tag information
        const interactedTags = await db
            .select()
            .from(tags)
            .where(inArray(tags.id, tagIds))
            .limit(limit);

        return interactedTags;
    } catch (error) {
        console.error("Error getting top interacted tags:", error);
        throw error;
    }
}

export async function getAllTags(params: GetAllTagsParams) {
    try {
        const { searchQuery, filter, page = 1, pageSize = 10 } = params;
        const skipAmount = (page - 1) * pageSize;

        const conditions = [];
        if (searchQuery) {
            conditions.push(ilike(tags.name, `%${searchQuery}%`));
        }

        let orderBy;
        switch (filter) {
            case "popular":
                // Order by number of questions (count of questionTags)
                orderBy = desc(sql<number>`(
                    SELECT COUNT(*) FROM ${questionTags} 
                    WHERE ${questionTags.tagId} = ${tags.id}
                )`);
                break;
            case "old":
                orderBy = asc(tags.createdOn);
                break;
            case "recent":
                orderBy = desc(tags.createdOn);
                break;
            case "name":
                orderBy = asc(tags.name);
                break;
            default:
                orderBy = desc(tags.createdOn);
                break;
        }

        const whereCondition = conditions.length > 0
            ? and(...conditions)
            : undefined;

        const tagsWithQuestionCount = await db
            .select({
                id: tags.id,
                name: tags.name,
                description: tags.description,
                createdOn: tags.createdOn,
                questionCount: sql<number>`(
                    SELECT COUNT(*) FROM ${questionTags} 
                    WHERE ${questionTags.tagId} = ${tags.id}
                )`
            })
            .from(tags)
            .where(whereCondition)
            .orderBy(orderBy)
            .limit(pageSize)
            .offset(skipAmount);

        const totalTags = await db
            .select({ count: sql<number>`count(*)` })
            .from(tags)
            .where(whereCondition)
            .then((res) => res[0].count);

        const isNext = totalTags > skipAmount + tagsWithQuestionCount.length;

        return { tags: tagsWithQuestionCount, isNext };
    } catch (error) {
        console.error("Error getting all tags:", error);
        throw error;
    }
}

export async function getQuestionsByTagId(params: GetQuestionsByTagIdParams) {
    try {
        const { tagId, searchQuery, page = 1, pageSize = 20 } = params;
        const skipAmount = (page - 1) * pageSize;

        // First, check if tag exists
        const tag = await db.query.tags.findFirst({
            where: eq(tags.id, tagId),
        });

        if (!tag) {
            throw new Error("Tag not found");
        }

        const conditions = [eq(questionTags.tagId, tagId)];
        if (searchQuery) {
            conditions.push(ilike(questions.title, `%${searchQuery}%`));
        }

        const questionsWithDetails = await db
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
                    picture: users.picture,
                    portfolioProfile: users.portfolioProfile,
                },
                forum: {
                    id: forums.id,
                    name: forums.name,
                    slug: forums.slug,
                    description: forums.description,
                    picture: forums.picture,
                    createdOn: forums.createdOn,
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
                    FROM ${questionTags} qt
                    LEFT JOIN ${tags} ON qt.tag_id = ${tags.id}
                    WHERE qt.question_id = ${questions.id}
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
            .innerJoin(questionTags, eq(questions.id, questionTags.questionId))
            .leftJoin(users, eq(questions.authorId, users.id))
            .leftJoin(forums, eq(questions.forumId, forums.id))
            .where(and(...conditions))
            .orderBy(desc(questions.createdAt))
            .limit(pageSize + 1)
            .offset(skipAmount);

        const isNext = questionsWithDetails.length > pageSize;
        const questionsToReturn = isNext ? questionsWithDetails.slice(0, -1) : questionsWithDetails;

        return {
            tagTitle: tag.name,
            questions: questionsToReturn,
            isNext
        };
    } catch (error) {
        console.error("Error getting questions by tag ID:", error);
        throw error;
    }
}

export async function getTopPopularTags() {
    try {
        const popularTags = await db
            .select({
                id: tags.id,
                name: tags.name,
                numberOfQuestions: sql<number>`(
                    SELECT COUNT(*) FROM ${questionTags} 
                    WHERE ${questionTags.tagId} = ${tags.id}
                )`
            })
            .from(tags)
            .orderBy(desc(sql<number>`(
                SELECT COUNT(*) FROM ${questionTags} 
                WHERE ${questionTags.tagId} = ${tags.id}
            )`))
            .limit(10);

        return popularTags;
    } catch (error) {
        console.error("Error getting top popular tags:", error);
        throw error;
    }
} 