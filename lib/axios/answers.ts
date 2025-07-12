import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    createAnswer,
    getAnswers,
    upvoteAnswer,
    downvoteAnswer,
    deleteAnswer
} from "../actions/answers";
import {
    CreateAnswerParams,
    GetAnswersParams,
    AnswerVoteParams,
    DeleteAnswerParams
} from "../actions/shared.types";

export function useAnswers(params: GetAnswersParams) {
    return useQuery({
        queryKey: ["answers", params.questionId, params.sortBy, params.page, params.pageSize],
        queryFn: () => getAnswers(params),
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
    });
}

export function useCreateAnswer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: CreateAnswerParams) => createAnswer(params),
        onSuccess: (_, variables) => {
            // Invalidate answers for this question
            queryClient.invalidateQueries({
                queryKey: ["answers", variables.questionId]
            });
            // Invalidate the specific question to update answer count
            queryClient.invalidateQueries({
                queryKey: ["question", variables.questionId.toString()]
            });
            // Invalidate all questions to update answer counts
            queryClient.invalidateQueries({ queryKey: ["questions"] });
        },
    });
}

export function useUpvoteAnswer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: AnswerVoteParams) => upvoteAnswer(params),
        onSuccess: () => {
            // Invalidate answers for this answer's question
            queryClient.invalidateQueries({
                queryKey: ["answers"],
                predicate: (query) => {
                    return query.queryKey[0] === "answers";
                }
            });
            // Invalidate user data to update reputation
            queryClient.invalidateQueries({ queryKey: ["user"] });
        },
        onError: (error) => {
            console.error("Error upvoting answer:", error);
        },
    });
}

export function useDownvoteAnswer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: AnswerVoteParams) => downvoteAnswer(params),
        onSuccess: () => {
            // Invalidate answers for this answer's question
            queryClient.invalidateQueries({
                queryKey: ["answers"],
                predicate: (query) => {
                    return query.queryKey[0] === "answers";
                }
            });
            // Invalidate user data to update reputation
            queryClient.invalidateQueries({ queryKey: ["user"] });
        },
        onError: (error) => {
            console.error("Error downvoting answer:", error);
        },
    });
}

export function useDeleteAnswer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: DeleteAnswerParams) => deleteAnswer(params),
        onSuccess: () => {
            // Invalidate all answers queries to refresh the data
            queryClient.invalidateQueries({
                queryKey: ["answers"],
                predicate: (query) => {
                    return query.queryKey[0] === "answers";
                }
            });
            // Invalidate questions to update answer counts
            queryClient.invalidateQueries({ queryKey: ["questions"] });
            // Invalidate specific question to update answer count
            queryClient.invalidateQueries({
                queryKey: ["question"],
                predicate: (query) => {
                    return query.queryKey[0] === "question";
                }
            });
        },
    });
} 