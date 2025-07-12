'use client'

import React, { use } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Users, MessageCircle, Calendar } from "lucide-react";
import { useGetforumById, useGetforumQuestions, useCheckforumMembership } from "@/lib/axios/forums";
import { useCurrentUser } from "@/lib/axios/users";
import Link from "next/link";
import Image from "next/image";
import { getTimestamp } from "@/lib/utils";
import ForumQuestionsList from "@/components/forums/forums-questions-list";
import JoinLeaveButton from "@/components/forums/join-leave-button";
import { useRouter } from "next/navigation";

interface ForumDetailPageProps {
    params: Promise<{
        id: string;
    }>;
    searchParams: Promise<{
        q?: string;
        filter?: "newest" | "frequent" | "unanswered";
        page?: string;
    }>;
}

const ForumDetailPage = ({ params, searchParams }: ForumDetailPageProps) => {
    const router = useRouter();
    const unwrappedParams = use(params);
    const unwrappedSearchParams = use(searchParams);
    const forumId = parseInt(unwrappedParams.id);

    // Get loop details
    const { data: forumInfo, isLoading: isForumLoading, error: forumError } = useGetforumById({ forumId });
    const { data: currentUser } = useCurrentUser();

    // Check membership status
    const { data: isMember = false } = useCheckforumMembership(
        forumId,
        currentUser?.user?.id
    );

    // Get questions parameters
    const searchQuery = unwrappedSearchParams.q || "";
    const filter = unwrappedSearchParams.filter || "newest";
    const page = parseInt(unwrappedSearchParams.page || "1");

    const { data: questionsResult, isLoading: isQuestionsLoading } = useGetforumQuestions({
        forumId,
        searchQuery,
        filter: filter as "newest" | "frequent" | "unanswered",
        page,
        pageSize: 20,
    });

    if (isForumLoading || isQuestionsLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (forumError || !forumInfo) {
        return (
            <div className="flex items-center justify-center min-h-[400px] flex-col gap-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Forum not found</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        The forum you&apos;re looking for doesn&apos;t exist or has been removed.
                    </p>
                    <Link href="/forums">
                        <Button className="px-6 py-3 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-colors">
                            Back to Forums
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }
    if (isNaN(forumId)) {
        router.push('/404');
        return null;
    }

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            {/* Forum Header */}
            <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-700 p-6 mb-8">
                <div className="flex flex-col items-start gap-4">
                    {/* Forum Image */}
                    <div className="w-24 h-24 rounded-lg bg-black dark:bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                        {forumInfo.picture ? (
                            <Image
                                src={forumInfo.picture}
                                alt="Forum picture"
                                width={96}
                                height={96}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-white dark:text-black font-bold text-3xl">
                                {forumInfo.name.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>

                    {/* Forum Info */}
                    <div className="flex flex-col items-start">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            {forumInfo.name}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 mb-3 text-lg">
                            {forumInfo.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-2">
                                <Users size={16} />
                                <span>{forumInfo.memberCount} members</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <MessageCircle size={16} />
                                <span>{forumInfo.questionCount} questions</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Calendar size={16} />
                                <span>Created {getTimestamp(forumInfo.createdAt)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        {currentUser?.success && currentUser.user && (
                            <>
                                <JoinLeaveButton
                                    forumId={forumId}
                                    userId={currentUser.user.id}
                                    isMember={isMember}
                                />
                                {isMember && (
                                    <>
                                        <Link href={`/forums/${forumId}/ask-question`}>
                                            <Button className="flex items-center gap-2 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black h-10 px-4">
                                                <Plus size={16} />
                                                Ask Question
                                            </Button>
                                        </Link>
                                        <Link href={`/forums/${forumId}/members`}>
                                            <Button variant="outline" className="flex items-center gap-2 h-10 px-4">
                                                <Users size={16} />
                                                Members
                                            </Button>
                                        </Link>
                                    </>
                                )}
                            </>
                        )}
                        {!currentUser?.success && (
                            <Link href="/sign-in">
                                <Button variant="outline" className="h-10 px-4">
                                    Sign in to join
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Questions Section */}
            <div className="bg-white dark:bg-black">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                        Questions
                    </h2>
                </div>

                <ForumQuestionsList
                    questions={questionsResult?.questions || []}
                    isNext={questionsResult?.isNext || false}
                    forumId={forumId}
                    searchQuery={searchQuery}
                    filter={filter as "newest" | "frequent" | "unanswered"}
                    page={page}
                    userClerkId={currentUser?.user?.clerkId || null}
                />
            </div>
        </div>
    );
};

export default ForumDetailPage;