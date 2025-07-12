import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getQuestions,
  getQuestionById,
  createQuestion,
  editQuestion,
  deleteQuestion,
  upvoteQuestion,
  downvoteQuestion,
  getTopQuestions,
  getRecommendedQuestions,
} from "../actions/questions";
import {
  GetQuestionsParams,
  GetQuestionByIdParams,
  CreateQuestionParams,
  EditQuestionParams,
  DeleteQuestionParams,
  QuestionVoteParams,
  RecommendedParams,
} from "../actions/shared.types";

// Vote status query
export function useQuestionVoteStatus(questionId: number, userId: number) {
  return useQuery({
    queryKey: ["question-vote", questionId, userId],
    queryFn: async () => {
      if (!userId || !questionId) return null;

      const response = await fetch("/api/check-vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, userId }),
      });

      if (!response.ok) throw new Error("Failed to check vote status");

      const data = await response.json();
      // Ensure we always return a defined value (null instead of undefined)
      return data.vote || null;
    },
    enabled: !!userId && !!questionId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Optimistic voting mutations
export function useUpvoteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: QuestionVoteParams) => upvoteQuestion(params),
    onMutate: async (variables) => {
      const { questionId, userId, hasupVoted, hasdownVoted } = variables;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["question-vote", questionId, userId],
      });

      // Snapshot previous value
      const previousVote = queryClient.getQueryData([
        "question-vote",
        questionId,
        userId,
      ]);

      // Optimistically update vote status
      let newVote = null;
      if (hasupVoted) {
        // Remove upvote
        newVote = null;
      } else if (hasdownVoted) {
        // Change from downvote to upvote
        newVote = { type: "upvote", questionId, userId };
      } else {
        // Add upvote
        newVote = { type: "upvote", questionId, userId };
      }

      queryClient.setQueryData(["question-vote", questionId, userId], newVote);

      // Update question vote counts in question lists
      queryClient.setQueriesData(
        { queryKey: ["questions"] },
        (
          oldData:
            | {
                questions?: Array<{
                  id: number;
                  totalVotes: number;
                  upvoteCount: number;
                  downvoteCount: number;
                }>;
              }
            | undefined
        ) => {
          if (!oldData?.questions) return oldData;

          return {
            ...oldData,
            questions: oldData.questions.map((q) => {
              if (q.id === questionId) {
                let totalVotesChange = 0;
                if (hasupVoted) {
                  totalVotesChange = -1; // Remove upvote
                } else if (hasdownVoted) {
                  totalVotesChange = 2; // Change downvote to upvote
                } else {
                  totalVotesChange = 1; // Add upvote
                }

                return {
                  ...q,
                  totalVotes: q.totalVotes + totalVotesChange,
                  upvoteCount: hasupVoted
                    ? q.upvoteCount - 1
                    : q.upvoteCount + 1,
                  downvoteCount: hasdownVoted
                    ? q.downvoteCount - 1
                    : q.downvoteCount,
                };
              }
              return q;
            }),
          };
        }
      );

      return { previousVote };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousVote !== undefined) {
        queryClient.setQueryData(
          ["question-vote", variables.questionId, variables.userId],
          context.previousVote
        );
      }
      // Invalidate to refetch correct data
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({
        queryKey: ["question", variables.questionId],
      });
    },
    onSettled: (data, error, variables) => {
      // Always refetch vote status to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ["question-vote", variables.questionId, variables.userId],
      });
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({
        queryKey: ["question", variables.questionId],
      });
    },
  });
}

export function useDownvoteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: QuestionVoteParams) => downvoteQuestion(params),
    onMutate: async (variables) => {
      const { questionId, userId, hasupVoted, hasdownVoted } = variables;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["question-vote", questionId, userId],
      });

      // Snapshot previous value
      const previousVote = queryClient.getQueryData([
        "question-vote",
        questionId,
        userId,
      ]);

      // Optimistically update vote status
      let newVote = null;
      if (hasdownVoted) {
        // Remove downvote
        newVote = null;
      } else if (hasupVoted) {
        // Change from upvote to downvote
        newVote = { type: "downvote", questionId, userId };
      } else {
        // Add downvote
        newVote = { type: "downvote", questionId, userId };
      }

      queryClient.setQueryData(["question-vote", questionId, userId], newVote);

      // Update question vote counts in question lists
      queryClient.setQueriesData(
        { queryKey: ["questions"] },
        (
          oldData:
            | {
                questions?: Array<{
                  id: number;
                  totalVotes: number;
                  upvoteCount: number;
                  downvoteCount: number;
                }>;
              }
            | undefined
        ) => {
          if (!oldData?.questions) return oldData;

          return {
            ...oldData,
            questions: oldData.questions.map((q) => {
              if (q.id === questionId) {
                let totalVotesChange = 0;
                if (hasdownVoted) {
                  totalVotesChange = 1; // Remove downvote
                } else if (hasupVoted) {
                  totalVotesChange = -2; // Change upvote to downvote
                } else {
                  totalVotesChange = -1; // Add downvote
                }

                return {
                  ...q,
                  totalVotes: q.totalVotes + totalVotesChange,
                  upvoteCount: hasupVoted ? q.upvoteCount - 1 : q.upvoteCount,
                  downvoteCount: hasdownVoted
                    ? q.downvoteCount - 1
                    : q.downvoteCount + 1,
                };
              }
              return q;
            }),
          };
        }
      );

      return { previousVote };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousVote !== undefined) {
        queryClient.setQueryData(
          ["question-vote", variables.questionId, variables.userId],
          context.previousVote
        );
      }
      // Invalidate to refetch correct data
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({
        queryKey: ["question", variables.questionId],
      });
    },
    onSettled: (data, error, variables) => {
      // Always refetch vote status to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ["question-vote", variables.questionId, variables.userId],
      });
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({
        queryKey: ["question", variables.questionId],
      });
    },
  });
}

// Other existing hooks
export function useQuestions(params: GetQuestionsParams) {
  return useQuery({
    queryKey: [
      "questions",
      params.searchQuery,
      params.filter,
      params.page,
      params.pageSize,
    ],
    queryFn: () => getQuestions(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useQuestionById(params: GetQuestionByIdParams) {
  return useQuery({
    queryKey: ["question", params.questionId],
    queryFn: () => getQuestionById(params),
    enabled: !!params.questionId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateQuestionParams) => createQuestion(params),
    onSuccess: () => {
      // Invalidate questions list to show new question
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}

export function useEditQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: EditQuestionParams) => editQuestion(params),
    onSuccess: (data, variables) => {
      // Invalidate specific question and questions list
      queryClient.invalidateQueries({
        queryKey: ["question", variables.questionId],
      });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: DeleteQuestionParams) => deleteQuestion(params),
    onSuccess: (data, variables) => {
      // Remove question from cache and invalidate lists
      queryClient.removeQueries({
        queryKey: ["question", variables.questionId],
      });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}

export function useTopQuestions() {
  return useQuery({
    queryKey: ["questions", "top"],
    queryFn: getTopQuestions,
    staleTime: 1000 * 60 * 10, // 10 minutes for top questions
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useRecommendedQuestions(params: RecommendedParams) {
  return useQuery({
    queryKey: [
      "questions",
      "recommended",
      params.userId,
      params.page,
      params.pageSize,
    ],
    queryFn: () => getRecommendedQuestions(params),
    enabled: !!params.userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
}
