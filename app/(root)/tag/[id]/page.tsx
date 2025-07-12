"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import QuestionCard from "@/components/cards/question-cards";
import Pagination from "@/components/common/pagination";
import { useQuestionsByTagId } from "@/lib/axios/tags";

interface PageParams {
    id: string;
}

const TagDetails = ({ params }: { params: Promise<PageParams> }) => {
    const unwrappedParams = use(params);
    const searchParams = useSearchParams();

    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1;
    const searchQuery = searchParams.get("q") || undefined;

    const { data: result, isLoading, error } = useQuestionsByTagId({
        tagId: parseInt(unwrappedParams.id),
        page,
        pageSize: 20,
        searchQuery,
    });

    const handlePageChange = (newPage: number) => {
        const url = new URL(window.location.href);
        url.searchParams.set("page", newPage.toString());
        window.history.pushState({}, "", url.toString());
        window.location.reload();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7000]"></div>
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className="flex items-center justify-center min-h-[400px] flex-col gap-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF] mb-2">Tag not found</h2>
                    <p className="text-[#5C5C7B] dark:text-[#858EAD] mb-4">
                        The tag you&apos;re looking for doesn&apos;t exist or has been removed.
                    </p>
                </div>
            </div>
        );
    }

    const { tagTitle, questions, isNext } = result;
    console.log(questions);

    return (
        <div className="mt-10 px-6 sm:px-12">
            <h1 className="h1-bold text-dark100_light900 light-border-2 border-b pb-4">
                {tagTitle}
            </h1>

            {/* Card section */}
            <div className="mt-5 flex flex-col gap-6">
                {questions.length > 0 ? (
                    questions.map((question) => (
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
                            forum={{
                                id: question.forum?.id || question.forumId || 0,
                                name: question.forum?.name || "No Community",
                                slug: question.forum?.slug || "",
                                description: question.forum?.description || "",
                                picture: question.forum?.picture || "",
                                createdOn: question.forum?.createdOn || new Date(),
                            }}
                            upvotes={question.upvoteCount}
                            downvotes={question.downvoteCount}
                            totalVotes={question.totalVotes}
                            views={question.views || 0}
                            answerCount={question.answerCount}
                            createdAt={question.createdAt}
                        />
                    ))
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
                                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z"
                                />
                            </svg>
                        </div>
                        <h2 className="h2-bold text-dark200_light900">Ummm.. no questions on this tag yet...</h2>
                        <p className="body-regular text-dark500_light700 mt-4">
                            Be the first to break the silence! 🚀 Ask a Question and kickstart the discussion.
                        </p>
                        <a
                            href="/ask-question"
                            className="inline-block mt-6 px-6 py-3 bg-[#FF7000] text-white rounded-md hover:bg-[#e6640a] transition-colors"
                        >
                            Ask a Question
                        </a>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {(page > 1 || isNext) && (
                <div className="mt-10">
                    <Pagination
                        pageNumber={page}
                        isNext={isNext}
                        onPageChange={handlePageChange}
                    />
                </div>
            )}
        </div>
    );
};

export default TagDetails; 