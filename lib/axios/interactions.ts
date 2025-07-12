import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { viewQuestion } from "../actions/interaction";
import { ViewQuestionParams } from "../actions/shared.types";

// Types for vote checking
interface VoteCheckParams {
    questionId?: number;
    answerId?: number;
    userId: number;
}

interface BatchVoteCheckParams {
    questionIds?: number[];
    answerIds?: number[];
    userId: number;
}

interface VoteStatus {
    questionId?: number;
    answerId?: number;
    type?: 'upvote' | 'downvote';
    hasVote: boolean;
}

// Single vote check
async function checkVote(params: VoteCheckParams) {
    const response = await fetch('/api/check-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
    });

    if (!response.ok) {
        throw new Error('Failed to check vote');
    }

    const data = await response.json();
    return {
        questionId: params.questionId,
        answerId: params.answerId,
        type: data.vote?.type,
        hasVote: !!data.vote
    } as VoteStatus;
}

// Batch vote check
async function checkVotesBatch(params: BatchVoteCheckParams): Promise<VoteStatus[]> {
    const promises: Promise<VoteStatus>[] = [];

    // Check all question votes
    if (params.questionIds) {
        params.questionIds.forEach(questionId => {
            promises.push(checkVote({ questionId, userId: params.userId }));
        });
    }

    // Check all answer votes
    if (params.answerIds) {
        params.answerIds.forEach(answerId => {
            promises.push(checkVote({ answerId, userId: params.userId }));
        });
    }

    return Promise.all(promises);
}

// Hook for checking a single vote
export function useVoteStatus(params: VoteCheckParams | null) {
    return useQuery({
        queryKey: ['voteStatus', params?.questionId, params?.answerId, params?.userId],
        queryFn: () => checkVote(params!),
        enabled: !!params && !!params.userId && (!!params.questionId || !!params.answerId),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
}

// Hook for batch checking votes (useful for question lists)
export function useBatchVoteStatus(params: BatchVoteCheckParams | null) {
    return useQuery({
        queryKey: ['batchVoteStatus', params?.questionIds, params?.answerIds, params?.userId],
        queryFn: () => checkVotesBatch(params!),
        enabled: !!params && !!params.userId && ((params.questionIds && params.questionIds.length > 0) || (params.answerIds && params.answerIds.length > 0)),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        select: (data) => {
            // Transform to a map for easier lookup
            const voteMap = new Map<string, VoteStatus>();
            data.forEach(vote => {
                const key = vote.questionId ? `question-${vote.questionId}` : `answer-${vote.answerId}`;
                voteMap.set(key, vote);
            });
            return voteMap;
        }
    });
}

// Hook for updating vote status after voting action
export function useUpdateVoteStatus() {
    const queryClient = useQueryClient();

    return {
        updateQuestionVote: (questionId: number, userId: number, voteType: 'upvote' | 'downvote' | null) => {
            // Update individual vote status
            queryClient.setQueryData(['voteStatus', questionId, undefined, userId], {
                questionId,
                type: voteType,
                hasVote: !!voteType
            });

            // Update batch vote status if it exists
            queryClient.setQueryData(['batchVoteStatus', undefined, undefined, userId], (oldData: Map<string, VoteStatus> | undefined) => {
                if (!oldData) return oldData;
                const newMap = new Map(oldData);
                newMap.set(`question-${questionId}`, {
                    questionId,
                    type: voteType || undefined,
                    hasVote: !!voteType
                });
                return newMap;
            });

            // Invalidate questions to update vote counts
            queryClient.invalidateQueries({ queryKey: ["questions"] });
            queryClient.invalidateQueries({ queryKey: ["question", questionId.toString()] });
        },

        updateAnswerVote: (answerId: number, userId: number, voteType: 'upvote' | 'downvote' | null) => {
            // Update individual vote status
            queryClient.setQueryData(['voteStatus', undefined, answerId, userId], {
                answerId,
                type: voteType,
                hasVote: !!voteType
            });

            // Update batch vote status if it exists
            queryClient.setQueryData(['batchVoteStatus', undefined, undefined, userId], (oldData: Map<string, VoteStatus> | undefined) => {
                if (!oldData) return oldData;
                const newMap = new Map(oldData);
                newMap.set(`answer-${answerId}`, {
                    answerId,
                    type: voteType || undefined,
                    hasVote: !!voteType
                });
                return newMap;
            });

            // Invalidate related queries
            queryClient.invalidateQueries({ queryKey: ["answers"] });
        }
    };
}

export function useViewQuestion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: ViewQuestionParams) => viewQuestion(params),
        onSuccess: (data, variables) => {
            // Invalidate questions list queries to refresh view counts
            queryClient.invalidateQueries({ queryKey: ["questions"] });

            // Invalidate specific question query if it exists
            queryClient.invalidateQueries({ queryKey: ["question", variables.questionId.toString()] });

            // Invalidate top questions query since it's based on views
            queryClient.invalidateQueries({ queryKey: ["topQuestions"] });

            console.log(`Question ${variables.questionId} view recorded successfully`);
        },
        onError: (error) => {
            console.error("Failed to record question view:", error);
        },
    });
} 