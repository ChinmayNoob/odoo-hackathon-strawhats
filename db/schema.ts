import { pgTable } from 'drizzle-orm/pg-core';
import * as t from "drizzle-orm/pg-core";


// Users table
export const users = pgTable(
    "users",
    {
        id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
        clerkId: t.varchar("clerk_id").notNull(),
        name: t.varchar().notNull(),
        username: t.varchar().notNull().unique(),
        email: t.varchar().notNull().unique(),
        password: t.varchar(),
        bio: t.text(),
        picture: t.varchar().notNull(),
        location: t.varchar(),
        portfolioProfile: t.varchar("portfolio_profile"),
        reputation: t.integer().default(0),
        joinedAt: t.timestamp("joined_at").defaultNow().notNull(),
    }
);

// Tags table
export const tags = pgTable(
    "tags",
    {
        id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
        name: t.varchar().notNull(),
        description: t.text().notNull(),
        createdOn: t.timestamp("created_on").defaultNow().notNull(),
    }
);

// Questions table
export const questions = pgTable(
    "questions",
    {
        id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
        title: t.varchar().notNull(),
        content: t.text().notNull(),
        views: t.integer().default(0),
        authorId: t.integer("author_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
        forumId: t.integer("forum_id").references(() => forums.id, { onDelete: "cascade" }),
        createdAt: t.timestamp("created_at").defaultNow().notNull(),
    }
);

// Question-Tag relations
export const questionTags = pgTable(
    "question_tags",
    {
        questionId: t.integer("question_id").references(() => questions.id, { onDelete: "cascade" }).notNull(),
        tagId: t.integer("tag_id").references(() => tags.id, { onDelete: "cascade" }).notNull(),
    }
);

// Answers table
export const answers = pgTable(
    "answers",
    {
        id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
        content: t.text().notNull(),
        authorId: t.integer("author_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
        questionId: t.integer("question_id").references(() => questions.id, { onDelete: "cascade" }).notNull(),
        createdAt: t.timestamp("created_at").defaultNow().notNull(),
    }
);

// Votes table (for both questions and answers)
export const votes = pgTable(
    "votes",
    {
        id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
        userId: t.integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
        questionId: t.integer("question_id").references(() => questions.id, { onDelete: "cascade" }),
        answerId: t.integer("answer_id").references(() => answers.id, { onDelete: "cascade" }),
        type: t.varchar().notNull(), // 'upvote' or 'downvote'
        createdAt: t.timestamp("created_at").defaultNow().notNull(),
    }
);

// Saved questions
export const savedQuestions = pgTable(
    "saved_questions",
    {
        userId: t.integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
        questionId: t.integer("question_id").references(() => questions.id, { onDelete: "cascade" }).notNull(),
        savedAt: t.timestamp("saved_at").defaultNow().notNull(),
    }
);

// Tag followers
export const tagFollowers = pgTable(
    "tag_followers",
    {
        userId: t.integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
        tagId: t.integer("tag_id").references(() => tags.id, { onDelete: "cascade" }).notNull(),
        followedAt: t.timestamp("followed_at").defaultNow().notNull(),
    }
);

// Interactions table
export const interactions = pgTable(
    "interactions",
    {
        id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
        userId: t.integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
        action: t.varchar().notNull(),
        questionId: t.integer("question_id").references(() => questions.id, { onDelete: "cascade" }),
        answerId: t.integer("answer_id").references(() => answers.id, { onDelete: "cascade" }),
        tagId: t.integer("tag_id").references(() => tags.id, { onDelete: "cascade" }),
        createdAt: t.timestamp("created_at").defaultNow().notNull(),
    }
);

export const forums = pgTable(
    "forums",
    {
        id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
        name: t.varchar().notNull().unique(),
        slug: t.varchar().notNull().unique(),
        description: t.text().notNull(),
        picture: t.varchar().notNull(),
        createdOn: t.timestamp("created_on").defaultNow().notNull(),
    }
)

export const forumMembers = pgTable(
    "forum_members",
    {
        forumId: t.integer("forum_id").references(() => forums.id, { onDelete: "cascade" }).notNull(),
        userId: t.integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
        role: t.varchar().default("member"),
        joinedAt: t.timestamp("joined_at").defaultNow().notNull(),
    }
)

export const notifications = pgTable(
    "notifications",
    {
        id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
        userId: t.integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
        type: t.varchar().notNull(), // 'answer', 'forum_question'
        title: t.varchar().notNull(),
        content: t.text().notNull(),
        questionId: t.integer("question_id").references(() => questions.id, { onDelete: "cascade" }),
        answerId: t.integer("answer_id").references(() => answers.id, { onDelete: "cascade" }),
        forumId: t.integer("forum_id").references(() => forums.id, { onDelete: "cascade" }),
        isRead: t.boolean().default(false),
        createdAt: t.timestamp("created_at").defaultNow().notNull(),
    }
);