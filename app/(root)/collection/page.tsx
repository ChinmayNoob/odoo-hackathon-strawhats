"use client";

import React, { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSavedQuestions } from '@/lib/axios/users';
import QuestionCard from '@/components/cards/question-cards';
import { GetSavedQuestionsParams } from '@/lib/actions/shared.types';
import { redirect } from 'next/navigation';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const CollectionPage = () => {
    const { user, isLoaded } = useUser();
    const [filter, setFilter] = useState<'newest' | 'frequent' | 'unanswered'>('newest');

    if (isLoaded && !user) {
        redirect('/sign-in');
    }

    const params: GetSavedQuestionsParams = {
        clerkId: user?.id || '',
        filter,
        page: 1,
        pageSize: 20,
    };

    const { data: result, isLoading, error } = useSavedQuestions(params);

    if (!isLoaded || isLoading) {
        return (
            <div className="flex flex-col">
                <div className="flex items-center justify-between">
                    <h1 className="h1-bold text-dark100_light900">Saved Questions</h1>
                </div>
                <div className="mt-8 flex w-full flex-col">
                    <div className="text-center">
                        <p className="body-regular text-dark500_light700">Loading saved questions...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col">
                <div className="flex items-center justify-between">
                    <h1 className="h1-bold text-dark100_light900">Saved Questions</h1>
                </div>
                <div className="mt-8 flex w-full flex-col">
                    <div className="text-center">
                        <p className="body-regular text-red-500">Error loading saved questions. Please try again.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col mt-4">
            <div className="flex items-center justify-between">
                <h1 className="font-bold text-2xl">Saved Questions</h1>
            </div>

            {/* Filter Controls */}
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

            {/* Questions List */}
            <div className="mt-8 flex w-full flex-col">
                {result && result.questions.length > 0 ? (
                    <>
                        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                            {result.questions.length} saved question{result.questions.length !== 1 ? 's' : ''}
                        </div>
                        {result.questions.map((question) => (
                            <QuestionCard
                                key={question.id || 0}
                                _id={(question.id || 0).toString()}
                                title={question.title || "Untitled"}
                                tags={question.tags.map(tag => ({
                                    _id: tag.id.toString(),
                                    name: tag.name
                                }))}
                                author={{
                                    _id: question.author?.id?.toString() || (question.authorId || 0).toString(),
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
                                createdAt={question.createdAt || new Date()}
                                clerkId={user?.id}
                            />
                        ))}
                    </>
                ) : (
                    <div className="mt-10 text-center">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                            <svg
                                className="h-10 w-10 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                                />
                            </svg>
                        </div>
                        <h2 className="h2-bold text-dark200_light900">No saved questions yet</h2>
                        <p className="body-regular text-dark500_light700 mt-4">
                            Start saving questions that interest you by clicking the bookmark icon on any question.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CollectionPage;
