import { questions, answers, users, tags, forums, forumMembers } from "@/db/schema";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

// Question Types
export type Question = InferSelectModel<typeof questions>;
export type NewQuestion = InferInsertModel<typeof questions>;

// Question with Author information
export interface QuestionWithAuthor {
    id: number;
    title: string;
    content: string;
    views: number | null;
    authorId: number;
    forumId: number | null;
    createdAt: Date;
    upvoteCount: number;
    downvoteCount: number;
    totalVotes: number;
    answerCount: number;
    tags: Array<{ id: number; name: string; description: string }>;
    author: {
        id: number | null;
        clerkId: string | null;
        name: string | null;
        username: string | null;
        email: string | null;
        picture: string | null;
        reputation: number | null;
        portfolioProfile: string | null;
    } | null;
    forum?: {
        id: number;
        name: string;
        slug: string;
        description: string;
        picture: string;
        createdOn: Date;
    } | null;
}

export interface GetQuestionsParams {
    searchQuery?: string;
    filter?: "newest" | "frequent" | "unanswered";
    page?: number;
    pageSize?: number;
}

export interface CreateQuestionParams {
    title: string;
    content: string;
    tags: string[];
    authorId: number;
    path: string;
}

export interface GetQuestionByIdParams {
    questionId: number;
}

export interface QuestionVoteParams {
    questionId: number;
    userId: number;
    hasupVoted: boolean;
    hasdownVoted: boolean;
    path: string;
}

export interface DeleteQuestionParams {
    questionId: number;
    userId: number;
    path: string;
}

export interface EditQuestionParams {
    questionId: number;
    title: string;
    content: string;
    tags?: string[];
    userId: number;
    path: string;
}

export interface RecommendedParams {
    userId: number;
    page?: number;
    pageSize?: number;
    searchQuery?: string;
}

// Answer Types
export type Answer = InferSelectModel<typeof answers>;
export type NewAnswer = InferInsertModel<typeof answers>;

export interface CreateAnswerParams {
    content: string;
    authorId: number;
    questionId: number;
    path: string;
}

export interface GetAnswersParams {
    questionId: number;
    sortBy?: string;
    page?: number;
    pageSize?: number;
}

export interface AnswerVoteParams {
    answerId: number;
    userId: number;
    hasupVoted: boolean;
    hasdownVoted: boolean;
    path: string;
}

export interface DeleteAnswerParams {
    answerId: number;
    path: string;
}

// User Types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export interface CreateUserParams {
    clerkId: string;
    name: string;
    username: string;
    email: string;
    picture: string;
}

export interface GetUserByIdParams {
    userId: number;
}

export interface GetAllUsersParams {
    page?: number;
    pageSize?: number;
    filter?: string;
    searchQuery?: string;
}

export interface UpdateUserParams {
    userId: number;
    updateData: Partial<Omit<NewUser, "id" | "clerkId">>;
    path: string;
}

// Tag Types
export type Tag = InferSelectModel<typeof tags>;
export type NewTag = InferInsertModel<typeof tags>;

export interface GetAllTagsParams {
    page?: number;
    pageSize?: number;
    filter?: string;
    searchQuery?: string;
}

export interface GetQuestionsByTagIdParams {
    tagId: number;
    page?: number;
    pageSize?: number;
    searchQuery?: string;
}

export interface GetTopInteractedTagsParams {
    userId: number;
    limit?: number;
}

// Saved Questions Types
export interface ToggleSaveQuestionParams {
    userId: string; // clerkId
    questionId: number;
    path: string;
}

export interface GetSavedQuestionsParams {
    clerkId: string;
    page?: number;
    pageSize?: number;
    filter?: string;
    searchQuery?: string;
}

export interface GetUserStatsParams {
    clerkId: string;
    page?: number;
    pageSize?: number;
}

export interface DeleteUserParams {
    userId: number;
}

// Interaction Types
export interface ViewQuestionParams {
    questionId: number;
    userId?: number;
}

// forum types 

export type forum = InferSelectModel<typeof forums>;
export type Newforum = InferInsertModel<typeof forums>;
export type forumMember = InferSelectModel<typeof forumMembers>;
export type NewforumMember = InferInsertModel<typeof forumMembers>;

export interface forumWithStats {
    id: number;
    name: string;
    slug: string;
    description: string;
    picture: string;
    createdAt: Date;
    memberCount: number;
    questionCount: number;
}

export interface forumWithMembership extends forumWithStats {
    role: string;
    joinedAt: Date;
}

export interface CreateforumParams {
    name: string;
    slug: string;
    description: string;
    picture: string;
    creatorId: number;
    path: string;
}

export interface EditforumParams {
    forumId: number;
    name?: string;
    description?: string;
    picture?: string;
    userId: number;
    path: string;
}

export interface DeleteforumParams {
    forumId: number;
    userId: number;
    path: string;
}

export interface JoinforumParams {
    forumId: number;
    userId: number;
    path: string;
}

export interface LeaveforumParams {
    forumId: number;
    userId: number;
    path: string;
}

export interface GetforumByIdParams {
    forumId: number;
}

export interface GetAllforumsParams {
    searchQuery?: string;
    filter?: "newest" | "popular" | "active";
    page?: number;
    pageSize?: number;
}

export interface GetforumQuestionsParams {
    forumId: number;
    searchQuery?: string;
    filter?: "newest" | "frequent" | "unanswered";
    page?: number;
    pageSize?: number;
}

export interface GetUserforumsParams {
    userId: number;
    page?: number;
    pageSize?: number;
}

export interface AskQuestionInforumParams {
    title: string;
    content: string;
    tags: string[];
    forumId?: number;
    authorId: number;
    path: string;
}

export interface GetforumMembersParams {
    forumId: number;
    page?: number;
    pageSize?: number;
    filter?: "all" | "admin" | "recent";
}

export interface forumMemberWithUser {
    id: number;
    clerkId: string;
    name: string;
    username: string;
    picture: string;
    reputation: number;
    role: string;
    joinedAt: Date;
}