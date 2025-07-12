"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { useQuestionVoteStatus, useUpvoteQuestion, useDownvoteQuestion } from "@/lib/axios/questions";
import { useCurrentUser } from "@/lib/axios/users";

interface VoteButtonsProps {
    questionId: number;
    totalVotes: number;
}

const VoteButtons = ({ questionId, totalVotes }: VoteButtonsProps) => {
    const [currentVotes, setCurrentVotes] = useState(totalVotes);

    const { user } = useUser();
    const pathname = usePathname();

    // Get current user data from database
    const { data: currentUserData } = useCurrentUser();
    const userId = currentUserData?.user?.id;

    // Get vote status using TanStack Query
    const { data: voteData, isLoading: isVoteLoading } = useQuestionVoteStatus(
        questionId,
        userId || 0
    );

    // Voting mutations
    const upvoteMutation = useUpvoteQuestion();
    const downvoteMutation = useDownvoteQuestion();

    // Determine vote states
    const hasUpvoted = voteData?.type === 'upvote';
    const hasDownvoted = voteData?.type === 'downvote';
    const isVoting = upvoteMutation.isPending || downvoteMutation.isPending;

    // Update currentVotes when totalVotes prop changes
    useEffect(() => {
        setCurrentVotes(totalVotes);
    }, [totalVotes]);

    const handleVote = async (type: 'upvote' | 'downvote') => {
        if (!user) {
            toast.error("Please sign in to vote");
            return;
        }

        if (!userId) {
            toast.error("User data not loaded");
            return;
        }

        if (isVoting) return;

        try {
            const voteParams = {
                questionId,
                userId,
                hasupVoted: hasUpvoted,
                hasdownVoted: hasDownvoted,
                path: pathname,
            };

            if (type === 'upvote') {
                // Optimistic update for UI responsiveness
                if (hasUpvoted) {
                    setCurrentVotes(prev => prev - 1);
                } else {
                    setCurrentVotes(prev => prev + (hasDownvoted ? 2 : 1));
                }

                await upvoteMutation.mutateAsync(voteParams);

                // Success messages
                if (hasUpvoted) {
                    toast.success("Vote removed");
                } else {
                    toast.success("Question upvoted!");
                }
            } else {
                // Optimistic update for UI responsiveness
                if (hasDownvoted) {
                    setCurrentVotes(prev => prev + 1);
                } else {
                    setCurrentVotes(prev => prev - (hasUpvoted ? 2 : 1));
                }

                await downvoteMutation.mutateAsync(voteParams);

                // Success messages
                if (hasDownvoted) {
                    toast.success("Vote removed");
                } else {
                    toast.success("Question downvoted");
                }
            }
        } catch (error) {
            console.error("Error voting:", error);
            toast.error("Error voting. Please try again.");
            // Reset optimistic update on error
            setCurrentVotes(totalVotes);
        }
    };

    if (isVoteLoading && user) {
        return (
            <div className="flex items-center gap-2">
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded px-4 py-2 w-20 h-8"></div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => handleVote('upvote')}
                disabled={isVoting}
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${hasUpvoted
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400'
                    } ${isVoting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                title={hasUpvoted ? "Remove upvote" : "Upvote question"}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4l8 8h-6v8h-4v-8H4l8-8z" />
                </svg>
            </button>

            <span className={`text-sm font-semibold min-w-[40px] text-center ${currentVotes > 0
                ? 'text-green-600 dark:text-green-400'
                : currentVotes < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                {currentVotes}
            </span>

            <button
                onClick={() => handleVote('downvote')}
                disabled={isVoting}
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${hasDownvoted
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                    } ${isVoting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                title={hasDownvoted ? "Remove downvote" : "Downvote question"}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 20l-8-8h6V4h4v8h6l-8 8z" />
                </svg>
            </button>
        </div>
    );
};

export default VoteButtons; 