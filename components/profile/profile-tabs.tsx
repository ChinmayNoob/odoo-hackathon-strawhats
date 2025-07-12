"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserQuestions, useUserAnswers } from "@/lib/axios/users";
import QuestionCard from "../cards/question-cards";
import Link from "next/link";
import { getTimestamp } from "@/lib/utils";
import ParseHTML from "@/components/common/parse-html";
import { useCurrentUser } from "@/lib/axios/users";

interface ProfileTabsProps {
    clerkId: string;
    isOwnProfile: boolean;
}

const ProfileTabs = ({ clerkId, isOwnProfile }: ProfileTabsProps) => {
    const [questionsPage, setQuestionsPage] = useState(1);
    const [answersPage, setAnswersPage] = useState(1);
    const pageSize = 10;

    const { data: currentUser } = useCurrentUser();

    const { data: questionsData, isLoading: questionsLoading } = useUserQuestions({
        clerkId,
        page: questionsPage,
        pageSize
    });

    const { data: answersData, isLoading: answersLoading } = useUserAnswers({
        clerkId,
        page: answersPage,
        pageSize
    });

    const questions = questionsData?.userQuestions || [];
    const isNextQuestion = questionsData?.isNextQuestion || false;

    const answers = answersData?.userAnswers || [];
    const isNextAnswer = answersData?.isNextAnswer || false;

    return (
        <div className="w-full mt-8">
            <Tabs defaultValue="questions" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="questions" className="text-base">
                        {isOwnProfile ? "Your Questions" : "Questions"}
                    </TabsTrigger>
                    <TabsTrigger value="answers" className="text-base">
                        {isOwnProfile ? "Your Answers" : "Answers"}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="questions" className="mt-6">
                    <div className="w-full">
                        {questionsLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7000]"></div>
                            </div>
                        ) : questions.length > 0 ? (
                            <div className="space-y-4">
                                {questions.map((question) => (
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
                                        clerkId={currentUser?.user?.clerkId}
                                    />
                                ))}

                                {/* Pagination for Questions */}
                                {(questionsPage > 1 || isNextQuestion) && (
                                    <div className="flex items-center justify-between mt-8">
                                        <button
                                            onClick={() => setQuestionsPage(prev => Math.max(prev - 1, 1))}
                                            disabled={questionsPage === 1}
                                            className="px-4 py-2 border border-[#cbcbcb] dark:border-[#212734] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#F4F6F8] dark:hover:bg-[#151821] disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                                        >
                                            Previous
                                        </button>
                                        <span className="text-sm text-[#5C5C7B] dark:text-[#858EAD]">
                                            Page {questionsPage}
                                        </span>
                                        <button
                                            onClick={() => setQuestionsPage(prev => prev + 1)}
                                            disabled={!isNextQuestion}
                                            className="px-4 py-2 border border-[#cbcbcb] dark:border-[#212734] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#F4F6F8] dark:hover:bg-[#151821] disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <h3 className="text-lg font-semibold text-[#000000] dark:text-[#FFFFFF] mb-2">
                                    {isOwnProfile ? "You haven't asked any questions yet" : "No questions asked yet"}
                                </h3>
                                <p className="text-[#5C5C7B] dark:text-[#858EAD] mb-4">
                                    {isOwnProfile ? "Start by asking your first question!" : "This user hasn't asked any questions yet."}
                                </p>
                                {isOwnProfile && (
                                    <Link
                                        href="/ask-question"
                                        className="inline-block px-6 py-3 bg-[#FF7000] text-white rounded-md hover:bg-[#e6640a] transition-colors"
                                    >
                                        Ask a Question
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="answers" className="mt-6">
                    <div className="w-full">
                        {answersLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7000]"></div>
                            </div>
                        ) : answers.length > 0 ? (
                            <div className="space-y-6">
                                {answers.map((answer) => (
                                    <div key={answer.id} className="border border-[#cbcbcb] dark:border-[#212734] rounded-lg p-6 bg-[#fdfdfd] dark:bg-[#09090A]">
                                        {/* Answer Header */}
                                        <div className="flex items-center justify-between mb-4">
                                            <Link
                                                href={`/question/${answer.questionId}`}
                                                className="flex-1"
                                            >
                                                <h3 className="text-lg font-semibold text-[#000000] dark:text-[#FFFFFF] hover:text-[#FF7000] dark:hover:text-[#FF7000] line-clamp-2">
                                                    {answer.question?.title || "Question"}
                                                </h3>
                                            </Link>
                                            <div className="flex items-center gap-2 ml-4">
                                                <span className={`text-sm font-semibold ${answer.totalVotes > 0 ? 'text-green-600' :
                                                    answer.totalVotes < 0 ? 'text-red-600' : 'text-gray-500'
                                                    }`}>
                                                    {answer.totalVotes} votes
                                                </span>
                                            </div>
                                        </div>

                                        {/* Answer Content Preview */}
                                        <div className="prose prose-base max-w-none text-[#212734] dark:text-[#DCE3F1] mb-4">
                                            <ParseHTML
                                                data={answer.content.length > 200 ?
                                                    answer.content.substring(0, 200) + "..." :
                                                    answer.content
                                                }
                                                classname="whitespace-pre-wrap leading-relaxed text-sm"
                                            />
                                        </div>

                                        {/* Answer Footer */}
                                        <div className="flex items-center justify-between text-sm text-[#5C5C7B] dark:text-[#858EAD]">
                                            <div className="flex items-center gap-4">
                                                <span>{answer.upvoteCount} upvotes</span>
                                                <span>{answer.downvoteCount} downvotes</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span>Answered {getTimestamp(answer.createdAt)}</span>
                                                <Link
                                                    href={`/question/${answer.questionId}`}
                                                    className="text-[#FF7000] hover:text-[#e6640a] font-medium"
                                                >
                                                    View Question
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Pagination for Answers */}
                                {(answersPage > 1 || isNextAnswer) && (
                                    <div className="flex items-center justify-between mt-8">
                                        <button
                                            onClick={() => setAnswersPage(prev => Math.max(prev - 1, 1))}
                                            disabled={answersPage === 1}
                                            className="px-4 py-2 border border-[#cbcbcb] dark:border-[#212734] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#F4F6F8] dark:hover:bg-[#151821] disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                                        >
                                            Previous
                                        </button>
                                        <span className="text-sm text-[#5C5C7B] dark:text-[#858EAD]">
                                            Page {answersPage}
                                        </span>
                                        <button
                                            onClick={() => setAnswersPage(prev => prev + 1)}
                                            disabled={!isNextAnswer}
                                            className="px-4 py-2 border border-[#cbcbcb] dark:border-[#212734] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#F4F6F8] dark:hover:bg-[#151821] disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <h3 className="text-lg font-semibold text-[#000000] dark:text-[#FFFFFF] mb-2">
                                    {isOwnProfile ? "You haven't answered any questions yet" : "No answers given yet"}
                                </h3>
                                <p className="text-[#5C5C7B] dark:text-[#858EAD] mb-4">
                                    {isOwnProfile ? "Start by answering questions from the community!" : "This user hasn't answered any questions yet."}
                                </p>
                                {isOwnProfile && (
                                    <Link
                                        href="/"
                                        className="inline-block px-6 py-3 bg-[#FF7000] text-white rounded-md hover:bg-[#e6640a] transition-colors"
                                    >
                                        Browse Questions
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ProfileTabs; 