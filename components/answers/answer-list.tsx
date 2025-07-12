'use client'

import React, { useState } from "react";
import { AnswerFilters } from "@/constants/filters";
import { useAnswers } from "@/lib/axios/answers";
import { useCurrentUser } from "@/lib/axios/users";
import Link from "next/link";
import Image from "next/image";
import { getTimestamp } from "@/lib/utils";
import ParseHTML from "@/components/common/parse-html";
import { Button } from "@/components/ui/button";
import AnswerVoteButtons from "./answer-vote-buttons";
import DeleteAnswer from "./delete-answer";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface AnswerListProps {
    questionId: number;
    totalAnswers: number;
}

const AnswerList = ({ questionId, totalAnswers }: AnswerListProps) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [currentFilter, setCurrentFilter] = useState("recent");
    const { data: currentUser } = useCurrentUser();

    const { data: answersData, isLoading: loading } = useAnswers({
        questionId,
        page: currentPage,
        sortBy: currentFilter,
        pageSize: 10
    });

    const answers = answersData?.answers || [];
    const isNext = answersData?.isNext || false;

    const handleFilterChange = (filter: string) => {
        setCurrentFilter(filter);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7000]"></div>
            </div>
        );
    }

    return (
        <div className="mt-8">
            {/* Header with filter */}
            <div className={answers.length > 0 ? "flex items-center justify-between mb-6" : "hidden"}>
                <h3 className="text-xl font-semibold text-[#000000] dark:text-[#FFFFFF]">
                    {totalAnswers} Answer{totalAnswers !== 1 ? 's' : ''}
                </h3>

                {/* Filter Dropdown */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-[#5C5C7B] dark:text-[#858EAD]">Sort by:</span>
                    <Select value={currentFilter} onValueChange={(value) => handleFilterChange(value)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                {AnswerFilters.map((filter) => (
                                    <SelectItem key={filter.value} value={filter.value}>
                                        {filter.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Answers List */}
            <div className="space-y-6">
                {answers.map((answer) => (
                    <div key={answer.id} className="border-b border-[#cbcbcb] dark:border-[#212734] pb-6">
                        {/* Answer Header */}
                        <div className="flex items-center justify-between mb-4">
                            <Link
                                href={`/profile/${answer.author?.clerkId}`}
                                className="flex items-center gap-3"
                            >
                                <div className="size-8 overflow-hidden rounded-full">
                                    <Image
                                        src={answer.author?.picture || "/assets/icons/avatar.svg"}
                                        alt="author profile"
                                        width={32}
                                        height={32}
                                        className="size-full object-cover"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <p className="font-semibold text-[#000000] dark:text-[#FFFFFF]">
                                        {answer.author?.name || "Unknown User"}
                                    </p>
                                    <p className="text-sm text-[#5C5C7B] dark:text-[#858EAD]">
                                        @{answer.author?.username || "unknown"} • {getTimestamp(answer.createdAt)}
                                    </p>
                                </div>
                            </Link>

                            <div className="flex items-center gap-3">
                                {/* Vote Buttons for Answers */}
                                <AnswerVoteButtons
                                    answerId={answer.id}
                                    totalVotes={answer.totalVotes}
                                />

                                {/* Delete Button - Only show if current user is the answer author */}
                                {currentUser?.success &&
                                    currentUser.user &&
                                    answer.authorId === currentUser.user.id && (
                                        <DeleteAnswer
                                            answerId={answer.id}
                                        />
                                    )}
                            </div>
                        </div>

                        {/* Answer Content */}
                        <div className="prose prose-base max-w-none text-[#212734] dark:text-[#DCE3F1]">
                            <ParseHTML
                                data={answer.content}
                                classname="whitespace-pre-wrap leading-relaxed"
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {(currentPage > 1 || isNext) && (
                <div className="flex items-center justify-between mt-8">
                    <Button
                        variant="outline"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="border-[#cbcbcb] dark:border-[#212734] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#F4F6F8] dark:hover:bg-[#151821]"
                    >
                        Previous
                    </Button>

                    <span className="text-sm text-[#5C5C7B] dark:text-[#858EAD]">
                        Page {currentPage}
                    </span>

                    <Button
                        variant="outline"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!isNext}
                        className="border-[#cbcbcb] dark:border-[#212734] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#F4F6F8] dark:hover:bg-[#151821]"
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* No answers message */}
            {answers.length === 0 && (
                <div className="text-center py-8">
                    <h3 className="text-lg font-semibold text-[#000000] dark:text-[#FFFFFF] mb-2">
                        No answers yet
                    </h3>
                    <p className="text-[#5C5C7B] dark:text-[#858EAD]">
                        Be the first to answer this question!
                    </p>
                </div>
            )}
        </div>
    );
};

export default AnswerList;
