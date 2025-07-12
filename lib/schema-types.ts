import { z } from "zod";

export const ProfileSchema = z.object({
    name: z.string().optional(),
    username: z.string().optional(),
    bio: z.string().optional(),
    leetcodeProfile: z.string().optional(),
    location: z.string().optional(),
});

export const AnswerSchema = z.object({
    answer: z.string().min(100, {
        message: "Answer must be at least 100 characters long"
    })
});
