"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, MessageCircle } from "lucide-react";
import { QuestionWithAuthor } from "@/lib/actions/shared.types";
import QuestionCard from "@/components/cards/question-cards";
import { useBatchVoteStatus } from "@/lib/axios/interactions";
import { useUser } from "@clerk/nextjs";
import { getUserByClerkId } from "@/lib/actions/users";

interface ForumQuestionsListProps {
    questions: QuestionWithAuthor[];
    isNext: boolean;
    forumId: number;
    searchQuery: string;
    filter: "newest" | "frequent" | "unanswered";
    page: number;
    userClerkId: string | null;
}
const ForumQuestionsList = ({
    questions,
    isNext,
    forumId,
    searchQuery,
    filter,
    page,
    userClerkId,
}: ForumQuestionsListProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useUser();
    const [search, setSearch] = useState(searchQuery);
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
        return questions.map(q => q.id);
    }, [questions]);

    // Batch check votes for all questions
    const { data: voteStatusMap } = useBatchVoteStatus(
        userId && questionIds.length > 0 ? { questionIds, userId } : null
    );

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams);
        if (search) {
            params.set("q", search);
        } else {
            params.delete("q");
        }
        params.set("page", "1");
        router.push(`/forums/${forumId}?${params.toString()}`);
    };

    const handleFilterChange = (newFilter: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("filter", newFilter);
        params.set("page", "1");
        router.push(`/forums/${forumId}?${params.toString()}`);
    };

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", newPage.toString());
        router.push(`/forums/${forumId}?${params.toString()}`);
    };

    return (
        <div className="space-y-6 p-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
                <form onSubmit={handleSearch} className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <Input
                        type="text"
                        placeholder="Search questions..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                    <Button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 px-3">
                        Search
                    </Button>
                </form>

                <Select value={filter} onValueChange={handleFilterChange}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="frequent">Most Viewed</SelectItem>
                        <SelectItem value="unanswered">Unanswered</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Questions List */}
            {questions.length > 0 ? (
                <div className="space-y-4">
                    {questions.map((question) => {
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
                                clerkId={userClerkId}
                                voteStatus={voteStatus}
                                forum={question.forum || undefined}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="mx-auto max-w-md">
                        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                            <MessageCircle size={48} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            No questions yet
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            {searchQuery
                                ? "Try adjusting your search terms or be the first to ask a question."
                                : "Be the first to ask a question in this community!"
                            }
                        </p>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {questions.length > 0 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                    <Button
                        variant="outline"
                        disabled={page === 1}
                        onClick={() => handlePageChange(page - 1)}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Page {page}
                    </span>
                    <Button
                        variant="outline"
                        disabled={!isNext}
                        onClick={() => handlePageChange(page + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
};

export default ForumQuestionsList;