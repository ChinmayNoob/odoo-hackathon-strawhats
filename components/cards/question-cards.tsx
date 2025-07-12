import Link from "next/link";
import React from "react";
import { getTimestamp } from "@/lib/utils";
import Image from "next/image";
import VoteButtons from "../questions/vote-buttons";
import { SiLeetcode } from "react-icons/si";
import { IoBookmarks, IoBookmarksOutline } from "react-icons/io5";
import { useToggleSaveQuestion, useIsQuestionSaved } from "@/lib/axios/users";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { useViewQuestion } from "@/lib/axios/interactions";

interface VoteStatus {
    questionId?: number;
    answerId?: number;
    type?: 'upvote' | 'downvote';
    hasVote: boolean;
}

interface QuestionProps {
    _id: string;
    title: string;
    tags: {
        _id: string;
        name: string;
    }[];
    author: {
        _id: string;
        clerkId: string;
        name: string;
        picture: string;
        portfolioProfile: string;
    };
    forum?: {
        id: number;
        name: string;
        slug: string;
        description: string;
        picture: string;
        createdOn: Date;
    };
    upvotes: number;
    downvotes: number;
    totalVotes: number;
    views: number;
    answerCount: number;
    createdAt: Date;
    clerkId?: string | null;
    voteStatus?: VoteStatus;
}

const QuestionCard = (props: QuestionProps) => {
    const {
        _id,
        title,
        tags,
        author,
        forum,
        totalVotes,
        views,
        answerCount,
        createdAt,
    } = props;

    const { user } = useUser();
    const toggleSaveMutation = useToggleSaveQuestion();
    const viewQuestionMutation = useViewQuestion();
    const [isClient, setIsClient] = React.useState(false);

    const questionId = parseInt(_id);

    const { data: isSaved, isLoading: isSavedLoading } = useIsQuestionSaved(
        user?.id || "",
        questionId
    );

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    const handleSaveQuestion = async () => {
        if (!user?.id) {
            toast.error("Please sign in to save questions");
            return;
        }

        try {
            const result = await toggleSaveMutation.mutateAsync({
                userId: user.id,
                questionId,
                path: "/",
            });

            if (result.success) {
                toast.success(result.saved ? "Question saved!" : "Question removed from saved");
            }
        } catch (error) {
            toast.error("Failed to save question");
            console.error("Error saving question:", error);
        }
    };

    const handleViewQuestion = () => {
        viewQuestionMutation.mutate({
            questionId,
            userId: user?.publicMetadata?.userId as number | undefined,
        });
    };

    return (
        <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-700 px-6 pb-6 pt-5 xs:mt-1 sm:px-10">
            <div className="flex flex-col items-start justify-between gap-4">
                <div className="flex justify-between items-start w-full">
                    <div className="flex items-start gap-2 px-2">
                        <div className="overflow-hidden w-[28px] h-[28px] rounded-full">
                            <Image
                                src={author.picture}
                                height={28}
                                width={28}
                                alt={`author`}
                                className="object-cover w-full h-full"
                            />
                        </div>
                        <div className="flex flex-col">
                            {forum && (
                                <Link href={`/forums/${forum.id}`} className="text-xs text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 font-medium">
                                    {forum.name}
                                </Link>
                            )}
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{author.name}</p>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {getTimestamp(createdAt)}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {user && isClient && (
                            <button
                                onClick={handleSaveQuestion}
                                disabled={toggleSaveMutation.isPending || isSavedLoading}
                                className="flex items-center justify-center hover:opacity-80 transition-opacity p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-900"
                                title={isSaved ? "Remove from saved" : "Save question"}
                            >
                                {isSaved ? (
                                    <IoBookmarks size={16} className="text-primary-500" />
                                ) : (
                                    <IoBookmarksOutline size={16} className="text-gray-500 hover:text-orange-500" />
                                )}
                            </button>
                        )}
                        {author.portfolioProfile && (
                            <Link
                                href={author.portfolioProfile}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center hover:opacity-80 transition-opacity"
                                title="LeetCode Profile"
                            >
                                <SiLeetcode
                                    size={14}
                                    className="text-orange-500 hover:text-orange-600 transition-colors"
                                />
                            </Link>
                        )}
                    </div>
                </div>
                <div className="flex justify-between items-center w-full">
                    <Link href={`/question/${_id}`} onClick={handleViewQuestion}>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 line-clamp-1 flex-1 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                            {title}
                        </h3>
                    </Link>
                </div>
            </div>

            <div className="md:flex md:justify-between md:items-center mt-6 flex w-full flex-col gap-2 md:flex-row">
                <div className="flex flex-wrap gap-2 md:w-2/3">
                    {tags.map((tag) => (
                        <span
                            key={tag._id}
                            className="inline-block text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md px-3 py-1 uppercase tracking-wide"
                        >
                            {tag.name}
                        </span>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <VoteButtons
                        questionId={parseInt(_id)}
                        totalVotes={totalVotes}
                    />
                    <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {answerCount} answers
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {views} views
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestionCard; 