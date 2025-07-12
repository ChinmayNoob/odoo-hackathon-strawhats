"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUpvoteAnswer, useDownvoteAnswer } from "@/lib/axios/answers";
import { useUser } from "@clerk/nextjs";
import { getUserByClerkId } from "@/lib/actions/users";
import { toast } from "sonner";
import { useVoteStatus, useUpdateVoteStatus } from "@/lib/axios/interactions";

interface VoteStatus {
    questionId?: number;
    answerId?: number;
    type?: 'upvote' | 'downvote';
    hasVote: boolean;
}

interface AnswerVoteButtonsProps {
    answerId: number;
    totalVotes: number;
    voteStatus?: VoteStatus;
}

const AnswerVoteButtons = ({ answerId, totalVotes, voteStatus: preloadedVoteStatus }: AnswerVoteButtonsProps) => {
    const [currentVotes, setCurrentVotes] = useState(totalVotes);
    const [userId, setUserId] = useState<number | null>(null);

    const { user } = useUser();
    const pathname = usePathname();
    const upvoteAnswerMutation = useUpvoteAnswer();
    const downvoteAnswerMutation = useDownvoteAnswer();

    // Get user ID once and cache it
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

    // Use the optimized vote status hook only if we don't have preloaded status
    const { data: fetchedVoteStatus, isLoading: isLoadingVote } = useVoteStatus(
        !preloadedVoteStatus && userId ? { answerId, userId } : null
    );

    // Use preloaded status if available, otherwise use fetched status
    const voteStatus = preloadedVoteStatus || fetchedVoteStatus;

    // Hook for updating vote status in cache
    const { updateAnswerVote } = useUpdateVoteStatus();

    // Update currentVotes when totalVotes prop changes (after refresh)
    useEffect(() => {
        setCurrentVotes(totalVotes);
    }, [totalVotes]);

    const hasUpvoted = !!(voteStatus?.hasVote && voteStatus?.type === 'upvote');
    const hasDownvoted = !!(voteStatus?.hasVote && voteStatus?.type === 'downvote');

    const handleVote = async (type: 'upvote' | 'downvote') => {
        if (!user || !userId) {
            toast.error("Please sign in to vote");
            return;
        }

        const isVoting = upvoteAnswerMutation.isPending || downvoteAnswerMutation.isPending;
        if (isVoting) return;

        try {
            if (type === 'upvote') {
                await upvoteAnswerMutation.mutateAsync({
                    answerId,
                    userId,
                    hasupVoted: hasUpvoted,
                    hasdownVoted: hasDownvoted,
                    path: pathname,
                });

                if (hasUpvoted) {
                    setCurrentVotes(prev => prev - 1);
                    updateAnswerVote(answerId, userId, null);
                    toast.success("Vote removed");
                } else {
                    setCurrentVotes(prev => prev + (hasDownvoted ? 2 : 1));
                    updateAnswerVote(answerId, userId, 'upvote');
                    toast.success("Answer upvoted!");
                }
            } else {
                await downvoteAnswerMutation.mutateAsync({
                    answerId,
                    userId,
                    hasupVoted: hasUpvoted,
                    hasdownVoted: hasDownvoted,
                    path: pathname,
                });

                if (hasDownvoted) {
                    setCurrentVotes(prev => prev + 1);
                    updateAnswerVote(answerId, userId, null);
                    toast.success("Vote removed");
                } else {
                    setCurrentVotes(prev => prev - (hasUpvoted ? 2 : 1));
                    updateAnswerVote(answerId, userId, 'downvote');
                    toast.success("Answer downvoted");
                }
            }
        } catch (error) {
            console.error("Error voting:", error);
            toast.error("Error voting. Please try again.");
        }
    };

    if ((isLoadingVote && !preloadedVoteStatus) || (!userId && user)) {
        return (
            <div className="flex items-center gap-2">
                <div className="animate-pulse bg-gray-200 rounded px-4 py-2 w-20 h-8"></div>
            </div>
        );
    }

    const isVoting = upvoteAnswerMutation.isPending || downvoteAnswerMutation.isPending;

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => handleVote('upvote')}
                disabled={isVoting}
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${hasUpvoted
                    ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                    } ${isVoting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4l8 8h-6v8h-4v-8H4l8-8z" />
                </svg>
            </button>

            <span className={`text-sm font-semibold min-w-[40px] text-center ${currentVotes > 0 ? 'text-green-600' :
                currentVotes < 0 ? 'text-red-600' : 'text-gray-500'
                }`}>
                {currentVotes}
            </span>

            <button
                onClick={() => handleVote('downvote')}
                disabled={isVoting}
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${hasDownvoted
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                    } ${isVoting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 20l-8-8h6V4h4v8h6l-8 8z" />
                </svg>
            </button>
        </div>
    );
};

export default AnswerVoteButtons; 