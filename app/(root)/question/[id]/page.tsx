'use client'

import { Button } from "@/components/ui/button";
import { getTimestamp } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import RenderTag from "@/components/common/render-tags";
import ParseHTML from "@/components/common/parse-html";
import VoteButtons from "@/components/questions/vote-buttons";
import DeleteQuestion from "@/components/questions/delete-question";
import AnswerList from "@/components/answers/answer-list";
import CreateAnswer from "@/components/answers/create-answer";
import { useQuestionById } from "@/lib/axios/questions";
import { useCurrentUser } from "@/lib/axios/users";
import { FaArrowLeft } from "react-icons/fa";
import { use } from "react";
import { useRouter } from "next/navigation";

interface PageParams {
    id: string;
}

const QuestionDetails = ({ params }: { params: Promise<PageParams> }) => {
    const router = useRouter();
    const unwrappedParams = use(params);
    console.log(unwrappedParams);
    const { data: questionInfo, isLoading, error } = useQuestionById({ questionId: parseInt(unwrappedParams.id) });
    const { data: currentUser } = useCurrentUser();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !questionInfo) {
        return (
            <div className="flex items-center justify-center min-h-[400px] flex-col gap-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Question not found</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        The question you&apos;re looking for doesn&apos;t exist or has been removed.
                    </p>
                    <Link href="/">
                        <Button className="px-6 py-3 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-colors">
                            Back to Questions
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const {
        id,
        title,
        content,
        views,
        createdAt,
        author,
        tags,
        totalVotes,
        answerCount
    } = questionInfo;

    // Check if current user is the author of the question
    const isAuthor = currentUser?.success && currentUser.user &&
        questionInfo.authorId === currentUser.user.id;

    return (
        <div className="w-full px-6 sm:px-12 py-8">
            {/* Back Button */}
            <div className="mb-6">
                <Button
                    variant="outline"
                    className="text-lg border border-gray-300 dark:border-gray-800 text-gray-700 dark:text-gray-300 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-neutral-800 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                    onClick={() => router.back()}
                >
                    <FaArrowLeft className="w-4 h-4" />
                    Back
                </Button>
            </div>

            {/* Question Header */}
            <div className="flex flex-col items-start w-full">
                <div className="mb-3 flex w-full flex-row items-center justify-between">
                    <Link
                        href={`/profile/${author?.clerkId}`}
                        className="flex items-center justify-start gap-3"
                    >
                        <div className="w-8 h-8 overflow-hidden rounded-full">
                            <Image
                                src={author?.picture || "/assets/icons/avatar.svg"}
                                alt="user profile picture"
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex flex-col">
                            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                {author?.name || "Unknown User"}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                @{author?.username || "unknown"}
                            </p>
                        </div>
                    </Link>

                    <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <Image
                            src="/assets/icons/clock.svg"
                            alt="time"
                            width={16}
                            height={16}
                            className="opacity-60"
                        />
                        {getTimestamp(createdAt)}
                    </span>
                </div>

                <h1 className="text-3xl font-bold leading-tight text-gray-900 dark:text-gray-100 mt-4 mb-6">
                    {title}
                </h1>
            </div>

            {/* Question Content */}
            <div className="prose prose-base max-w-none text-gray-800 dark:text-gray-200 mb-8">
                <ParseHTML
                    data={content}
                    classname="whitespace-pre-wrap leading-relaxed"
                />
            </div>

            {/* Tags and Voting Section */}
            <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-6 mb-8">
                <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                        <RenderTag
                            key={tag.id}
                            _id={tag.id.toString()}
                            name={tag.name}
                            showCount={false}
                        />
                    ))}
                </div>

                <div className="flex items-center gap-6">
                    <VoteButtons
                        questionId={id}
                        totalVotes={totalVotes}
                    />

                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Image
                            src="/assets/icons/eye.svg"
                            alt="views"
                            width={16}
                            height={16}
                            className="opacity-60"
                        />
                        <span className="text-sm">
                            {views || 0} view{(views || 0) !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-gray-300 dark:border-gray-600 pt-6">
                <div className="flex gap-4 flex-wrap">
                    <Link href="/">
                        <Button variant="outline" className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors">
                            Back to Questions
                        </Button>
                    </Link>

                    {/* Only show Edit and Delete buttons to the author */}
                    {isAuthor && (
                        <>
                            <Link href={`/question/edit/${id}`}>
                                <Button variant="outline" className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors">
                                    Edit Question
                                </Button>
                            </Link>
                            <DeleteQuestion questionId={id} />
                        </>
                    )}

                    <Link href="/ask-question">
                        <Button className="px-6 py-3 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-colors">
                            Ask a Question
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Answers Section */}
            <AnswerList questionId={id} totalAnswers={answerCount || 0} />

            {/* Create Answer Form */}
            <CreateAnswer questionId={id} />
        </div>
    );
};

export default QuestionDetails;
