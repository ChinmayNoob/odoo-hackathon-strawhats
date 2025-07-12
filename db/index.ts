import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users, questions, tags, questionTags, votes, interactions, answers, savedQuestions, forums, forumMembers, notifications } from './schema';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be a Neon postgres connection string')
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, {
    schema: {
        users,
        questions,
        tags,
        questionTags,
        votes,
        interactions,
        answers,
        savedQuestions,
        forums,
        notifications,
        forumMembers
    }
});