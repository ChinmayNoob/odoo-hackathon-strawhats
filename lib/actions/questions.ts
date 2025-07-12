"use server";

import { db } from "@/db";
import {
  questions,
  tags,
  questionTags,
  users,
  votes,
  interactions,
  answers,
  forums,
} from "@/db/schema";
import { revalidatePath } from "next/cache";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  CreateQuestionParams,
  DeleteQuestionParams,
  EditQuestionParams,
  GetQuestionByIdParams,
  GetQuestionsParams,
  QuestionVoteParams,
  RecommendedParams,
  QuestionWithAuthor,
} from "./shared.types";

export async function getQuestions(
  params: GetQuestionsParams
): Promise<{ questions: QuestionWithAuthor[]; isNext: boolean }> {
  try {
    const { searchQuery, filter, page = 1, pageSize = 20 } = params;
    const skipAmount = (page - 1) * pageSize;

    const conditions = [];
    if (searchQuery) {
      conditions.push(
        or(
          ilike(questions.title, `%${searchQuery}%`),
          ilike(questions.content, `%${searchQuery}%`)
        )
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

    // Combine all conditions
    const allConditions =
      conditions.length > 0
        ? and(...conditions, ...additionalConditions)
        : additionalConditions.length > 0
        ? and(...additionalConditions)
        : undefined;

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
                )`,
      })
      .from(questions)
      .leftJoin(users, eq(questions.authorId, users.id))
      .leftJoin(forums, eq(questions.forumId, forums.id))
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
    console.error("Error getting questions:", error);
    throw error;
  }
}

export async function createQuestion(params: CreateQuestionParams) {
  try {
    const { title, content, tags: tagNames, authorId, path } = params;

    // Create the question
    const [question] = await db
      .insert(questions)
      .values({
        title,
        content,
        authorId,
      })
      .returning();

    // Create or get tags and create question-tag relations
    for (const tagName of tagNames) {
      // Normalize tag name to uppercase to prevent duplicates
      const normalizedTagName = tagName.toUpperCase().trim();

      // First, try to find existing tag
      let tag = await db.query.tags.findFirst({
        where: eq(tags.name, normalizedTagName),
      });

      // If tag doesn't exist, create it
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

      // Create question-tag relation
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
    revalidatePath("/");
    revalidatePath("/community");
    revalidatePath("/collection");
    return { success: true, question };
  } catch (error) {
    console.error("Error creating question:", error);
    return { success: false, error: "Failed to create question" };
  }
}

export async function getQuestionById(params: GetQuestionByIdParams) {
  try {
    const { questionId } = params;

    const [question] = await db
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
                )`,
      })
      .from(questions)
      .leftJoin(users, eq(questions.authorId, users.id))
      .leftJoin(forums, eq(questions.forumId, forums.id))
      .where(eq(questions.id, questionId));

    if (!question) {
      throw new Error("Question not found");
    }

    return question;
  } catch (error) {
    console.error("Error getting question:", error);
    throw error;
  }
}

export async function upvoteQuestion(params: QuestionVoteParams) {
  try {
    const { questionId, userId, hasupVoted, hasdownVoted, path } = params;

    const existingVote = await db.query.votes.findFirst({
      where: and(eq(votes.questionId, questionId), eq(votes.userId, userId)),
    });

    if (hasupVoted) {
      if (existingVote) {
        await db.delete(votes).where(eq(votes.id, existingVote.id));
      }
    } else if (hasdownVoted) {
      if (existingVote) {
        await db
          .update(votes)
          .set({ type: "upvote" })
          .where(eq(votes.id, existingVote.id));
      }
    } else {
      await db.insert(votes).values({
        userId,
        questionId,
        type: "upvote",
      });
    }

    const reputationChange = hasupVoted ? -1 : 1;
    await db
      .update(users)
      .set({ reputation: sql`reputation + ${reputationChange}` })
      .where(eq(users.id, userId));

    const question = await db.query.questions.findFirst({
      where: eq(questions.id, questionId),
    });

    if (question) {
      const authorReputationChange = hasupVoted ? -10 : 10;
      await db
        .update(users)
        .set({ reputation: sql`reputation + ${authorReputationChange}` })
        .where(eq(users.id, question.authorId));
    }

    revalidatePath(path);
  } catch (error) {
    console.error("Error upvoting question:", error);
    throw error;
  }
}

export async function downvoteQuestion(params: QuestionVoteParams) {
  try {
    const { questionId, userId, hasupVoted, hasdownVoted, path } = params;

    const existingVote = await db.query.votes.findFirst({
      where: and(eq(votes.questionId, questionId), eq(votes.userId, userId)),
    });

    if (hasdownVoted) {
      if (existingVote) {
        await db.delete(votes).where(eq(votes.id, existingVote.id));
      }
    } else if (hasupVoted) {
      if (existingVote) {
        await db
          .update(votes)
          .set({ type: "downvote" })
          .where(eq(votes.id, existingVote.id));
      }
    } else {
      await db.insert(votes).values({
        userId,
        questionId,
        type: "downvote",
      });
    }

    const reputationChange = hasdownVoted ? 2 : -2;
    await db
      .update(users)
      .set({ reputation: sql`reputation + ${reputationChange}` })
      .where(eq(users.id, userId));

    const question = await db.query.questions.findFirst({
      where: eq(questions.id, questionId),
    });

    if (question) {
      const authorReputationChange = hasdownVoted ? 10 : -10;
      await db
        .update(users)
        .set({ reputation: sql`reputation + ${authorReputationChange}` })
        .where(eq(users.id, question.authorId));
    }

    revalidatePath(path);
  } catch (error) {
    console.error("Error downvoting question:", error);
    throw error;
  }
}

export async function deleteQuestion(params: DeleteQuestionParams) {
  try {
    const { questionId, userId, path } = params;

    // First, check if the question exists and get the author
    const existingQuestion = await db.query.questions.findFirst({
      where: eq(questions.id, questionId),
    });

    if (!existingQuestion) {
      return { success: false, error: "Question not found" };
    }

    // Check if the current user is the author
    if (existingQuestion.authorId !== userId) {
      return {
        success: false,
        error: "Unauthorized: Only the author can delete this question",
      };
    }

    // Delete related data first (foreign key constraints)
    await db
      .delete(questionTags)
      .where(eq(questionTags.questionId, questionId));
    await db.delete(votes).where(eq(votes.questionId, questionId));
    await db
      .delete(interactions)
      .where(eq(interactions.questionId, questionId));

    // Delete the question itself
    await db.delete(questions).where(eq(questions.id, questionId));

    revalidatePath(path);
    return { success: true };
  } catch (error) {
    console.error("Error deleting question:", error);
    return { success: false, error: "Failed to delete question" };
  }
}

export async function editQuestion(params: EditQuestionParams) {
  try {
    const { questionId, title, content, tags: tagNames, userId, path } = params;

    // First, check if the question exists and get the author
    const existingQuestion = await db.query.questions.findFirst({
      where: eq(questions.id, questionId),
    });

    if (!existingQuestion) {
      return { success: false, error: "Question not found" };
    }

    // Check if the current user is the author
    if (existingQuestion.authorId !== userId) {
      return {
        success: false,
        error: "Unauthorized: Only the author can edit this question",
      };
    }

    // Update the question
    await db
      .update(questions)
      .set({ title, content })
      .where(eq(questions.id, questionId));

    // Always delete existing question-tag relations first
    await db
      .delete(questionTags)
      .where(eq(questionTags.questionId, questionId));

    // If tags are provided, create new ones
    if (tagNames && tagNames.length > 0) {
      // Create new tags and relations
      for (const tagName of tagNames) {
        // Normalize tag name to uppercase to prevent duplicates
        const normalizedTagName = tagName.toUpperCase().trim();

        // Find or create tag
        const [tag] = await db
          .insert(tags)
          .values({
            name: normalizedTagName,
            description: `Questions about ${normalizedTagName}`,
          })
          .onConflictDoUpdate({
            target: tags.name,
            set: { name: normalizedTagName },
          })
          .returning();

        // Create question-tag relation
        await db.insert(questionTags).values({
          questionId: questionId,
          tagId: tag.id,
        });
      }
    }

    revalidatePath(path);
    return { success: true };
  } catch (error) {
    console.error("Error editing question:", error);
    return { success: false, error: "Failed to edit question" };
  }
}

export async function getTopQuestions() {
  try {
    const topQuestions = await db
      .select()
      .from(questions)
      .orderBy(desc(questions.views))
      .limit(5);

    return topQuestions;
  } catch (error) {
    console.error("Error getting top questions:", error);
    throw error;
  }
}

export async function getRecommendedQuestions(params: RecommendedParams) {
  try {
    const { userId, page = 1, pageSize = 20, searchQuery } = params;
    const skipAmount = (page - 1) * pageSize;

    type InteractionWithQuestion = {
      question?: {
        tags: Array<{
          tag: {
            id: number;
          };
        }>;
      };
    };

    const userInteractions = (await db.query.interactions.findMany({
      where: eq(interactions.userId, userId),
      with: {
        question: {
          with: {
            tags: {
              with: {
                tag: true,
              },
            },
          },
        },
      },
    })) as InteractionWithQuestion[];

    const userTagIds = new Set<number>();
    userInteractions.forEach((interaction) => {
      if (interaction.question?.tags) {
        interaction.question.tags.forEach((qt) => {
          if (qt.tag) {
            userTagIds.add(qt.tag.id);
          }
        });
      }
    });

    const recommendedQuestions = await db
      .select()
      .from(questions)
      .where(
        and(
          sql`EXISTS (
                        SELECT 1 FROM ${questionTags}
                        WHERE ${questionTags.questionId} = ${questions.id}
                        AND ${questionTags.tagId} IN (${Array.from(userTagIds)})
                    )`,
          sql`${questions.authorId} != ${userId}`,
          searchQuery
            ? or(
                ilike(questions.title, `%${searchQuery}%`),
                ilike(questions.content, `%${searchQuery}%`)
              )
            : undefined
        )
      )
      .limit(pageSize)
      .offset(skipAmount);

    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(questions)
      .where(
        and(
          sql`EXISTS (
                        SELECT 1 FROM ${questionTags}
                        WHERE ${questionTags.questionId} = ${questions.id}
                        AND ${questionTags.tagId} IN (${Array.from(userTagIds)})
                    )`,
          sql`${questions.authorId} != ${userId}`
        )
      )
      .then((res) => res[0].count);

    const isNext = totalCount > skipAmount + recommendedQuestions.length;

    return { questions: recommendedQuestions, isNext };
  } catch (error) {
    console.error("Error getting recommended questions:", error);
    throw error;
  }
}
