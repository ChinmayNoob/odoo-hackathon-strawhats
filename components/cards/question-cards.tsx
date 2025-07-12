import Link from "next/link";
import React from "react";
import { getTimestamp } from "@/lib/utils";
import Image from "next/image";
import VoteButtons from "../questions/vote-buttons";
import { IoBookmarks, IoBookmarksOutline } from "react-icons/io5";
import { FiEye, FiMessageCircle } from "react-icons/fi";
import { useToggleSaveQuestion, useIsQuestionSaved } from "@/lib/axios/users";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { useViewQuestion } from "@/lib/axios/interactions";
import { FaGlobe } from "react-icons/fa6";

interface VoteStatus {
  questionId?: number;
  answerId?: number;
  type?: "upvote" | "downvote";
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
        toast.success(
          result.saved ? "Question saved!" : "Question removed from saved"
        );
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
    <div className="group bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-xl p-6 transition-all duration-300 hover:shadow-lg dark:hover:shadow-gray-800/25 mb-4">
      {/* Header Section */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="relative">
            <div className="overflow-hidden w-10 h-10 rounded-full ring-2 ring-gray-200 dark:ring-gray-700">
              <Image
                src={author.picture}
                height={40}
                width={40}
                alt={`${author.name}'s avatar`}
                className="object-cover w-full h-full"
              />
            </div>
            {author.portfolioProfile && (
              <Link
                href={author.portfolioProfile}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute -bottom-1 -right-1 bg-orange-500 hover:bg-orange-600 transition-colors rounded-full p-1 shadow-lg"
                title="LeetCode Profile"
              >
                <FaGlobe size={10} className="text-white" />
              </Link>
            )}
          </div>

          <div className="flex flex-col min-w-0">
            {forum && (
              <Link
                href={`/forums/${forum.id}`}
                className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 mb-1 transition-colors"
              >
                {forum.name}
              </Link>
            )}
            <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {author.name}
            </p>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {getTimestamp(createdAt)}
            </span>
          </div>
        </div>

        {/* Save Button */}
        {user && isClient && (
          <button
            onClick={handleSaveQuestion}
            disabled={toggleSaveMutation.isPending || isSavedLoading}
            className="flex items-center justify-center hover:scale-105 transition-transform p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 group"
            title={isSaved ? "Remove from saved" : "Save question"}
          >
            {isSaved ? (
              <IoBookmarks size={18} className="text-primary-500" />
            ) : (
              <IoBookmarksOutline
                size={18}
                className="text-gray-400 group-hover:text-primary-500 transition-colors"
              />
            )}
          </button>
        )}
      </div>

      {/* Title Section */}
      <div className="mb-4">
        <Link href={`/question/${_id}`} onClick={handleViewQuestion}>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-tight">
            {title}
          </h3>
        </Link>
      </div>

      {/* Tags Section */}
      <div className="flex flex-wrap gap-2 mb-5">
        {tags.map((tag) => (
          <span
            key={tag._id}
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:shadow-sm transition-shadow"
          >
            {tag.name}
          </span>
        ))}
      </div>

      {/* Bottom Stats Section */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <VoteButtons questionId={parseInt(_id)} totalVotes={totalVotes} />

          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <FiMessageCircle size={16} />
            <span className="text-sm font-medium">{answerCount}</span>
          </div>

          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
            <FiEye size={16} />
            <span className="text-sm font-medium">{views}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default QuestionCard;
