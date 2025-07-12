"use client";

import React, { useMemo, useState } from 'react';
import QuestionCard from "@/components/cards/question-cards";
import { useQuestions } from "@/lib/axios/questions";
import { GetQuestionsParams } from "@/lib/actions/shared.types";
import { useUser } from "@clerk/nextjs";
import { getUserByClerkId } from "@/lib/actions/users";
import { useEffect } from 'react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useBatchVoteStatus } from '@/lib/axios/interactions';

interface QuestionsListProps {
    params: GetQuestionsParams;
    clerkId: string | null;
    showFilter?: boolean;
}

export default function QuestionsList({ params, clerkId, showFilter = false }: QuestionsListProps) {
    const [filter, setFilter] = useState<'newest' | 'frequent' | 'unanswered'>('newest');
    const { data: result, isLoading, error } = useQuestions({
        ...params,
        filter: showFilter ? filter : params.filter
    });

    // Fixed: Use question.loop instead of question.loops
    console.log(result);

    const { user } = useUser();
    const [userId, setUserId] = useState<number | null>(null);

    // Get user ID for batch vote checking
    useEffect(() => {
        const fetchUserId = async () => {
            if (!user) {
                setUserId(null);
                return;
            }

            try {
                const userResult = await getUserByClerkId(user.id);
                if (userResult.success) {
                    setUserId(userResult.user!.id);
                }
            } catch (error) {
                console.error("Error fetching user:", error);
                setUserId(null);
            }
        };

        fetchUserId();
    }, [user]);

    // Extract question IDs for batch vote checking
    const questionIds = useMemo(() => {
        return result?.questions?.map(q => q.id) || [];
    }, [result]);

    // Batch check votes for all questions
    const { data: voteStatusMap } = useBatchVoteStatus(
        userId && questionIds.length > 0 ? { questionIds, userId } : null
    );

    if (isLoading) {
        return (
            <div className="mt-8 flex w-full flex-col">
                <div className="text-center">
                    <p className="body-regular text-dark500_light700">Loading questions...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-8 flex w-full flex-col">
                <div className="text-center">
                    <p className="body-regular text-red-500">Error loading questions. Please try again.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-8 flex w-full flex-col">
            {/* Filter Controls - only show if showFilter is true */}
            {showFilter && (
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-2">
                        <Select value={filter} onValueChange={(value) => setFilter(value as 'newest' | 'frequent' | 'unanswered')}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="newest">Newest</SelectItem>
                                    <SelectItem value="frequent">Most Viewed</SelectItem>
                                    <SelectItem value="unanswered">Unanswered</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {result && result.questions.length > 0 ? (
                result.questions.map((question) => {
                    // Get vote status for this specific question
                    const voteStatus = voteStatusMap?.get(`question-${question.id}`);

                    return (
                        <QuestionCard
                            key={question.id}
                            _id={question.id.toString()}
                            title={question.title}
                            tags={question.tags.map(tag => ({
                                _id: tag.id.toString(),
                                name: tag.name
                            }))}
                            // Fixed: Use question.loop instead of question.loops
                            forum={{
                                id: question.forum?.id || question.forumId || 0,
                                name: question.forum?.name || "No Community",
                                slug: question.forum?.slug || "",
                                description: question.forum?.description || "",
                                picture: question.forum?.picture || "",
                                createdOn: question.forum?.createdOn || new Date(),
                            }}
                            author={{
                                _id: question.author?.id?.toString() || question.authorId.toString(),
                                clerkId: question.author?.clerkId || "",
                                name: question.author?.name || "Unknown User",
                                picture: question.author?.picture || "/assets/icons/avatar.svg",
                                portfolioProfile: question.author?.portfolioProfile || "",
                            }}
                            upvotes={question.upvoteCount}
                            downvotes={question.downvoteCount}
                            totalVotes={question.totalVotes}
                            views={question.views || 0}
                            answerCount={question.answerCount}
                            createdAt={question.createdAt}
                            clerkId={clerkId}
                            voteStatus={voteStatus}
                        />
                    );
                })
            ) : (
                <div className="mt-10 text-center">
                    <h2 className="h2-bold text-dark200_light900">No questions yet</h2>
                    <p className="body-regular text-dark500_light700 mt-4">
                        Be the first to ask a question!
                    </p>
                </div>
            )}
        </div>
    );
}