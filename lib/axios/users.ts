import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserInfo, getUserByClerkId, updateUser, getSavedQuestions, getUserQuestions, getUserAnswers, toggleSaveQuestion, checkIsQuestionSaved, getAllUsers } from "../actions/users";
import { useAuth } from "@clerk/nextjs";
import { GetSavedQuestionsParams, GetUserStatsParams, ToggleSaveQuestionParams, GetAllUsersParams } from "../actions/shared.types";

export function useUserInfo(userId: string) {
    return useQuery({
        queryKey: ["user", userId],
        queryFn: () => getUserInfo({ userId }),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    });
}

export function useUserByClerkId(clerkId: string) {
    return useQuery({
        queryKey: ["user", "clerk", clerkId],
        queryFn: () => getUserByClerkId(clerkId),
        enabled: !!clerkId,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    });
}

export function useCurrentUser() {
    const { userId } = useAuth();
    return useUserByClerkId(userId || '');
}

export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ clerkId, updateData, path }: {
            clerkId: string;
            updateData: Partial<{
                name: string;
                username: string;
                leetcodeProfile?: string;
                location: string;
                bio: string;
            }>;
            path: string;
        }) => {
            return updateUser({ clerkId, updateData, path });
        },
        onSuccess: (_, variables) => {
            // Invalidate all user-related queries
            queryClient.invalidateQueries({ queryKey: ["user"] });
            // Specifically invalidate the clerk user query
            queryClient.invalidateQueries({ queryKey: ["user", "clerk", variables.clerkId] });
        },
    });
}

export function useSavedQuestions(params: GetSavedQuestionsParams) {
    return useQuery({
        queryKey: ["user", "saved-questions", params.clerkId, params.page, params.pageSize, params.filter, params.searchQuery],
        queryFn: () => getSavedQuestions(params),
        enabled: !!params.clerkId,
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 5,
    });
}

export function useUserQuestions(params: GetUserStatsParams) {
    return useQuery({
        queryKey: ["user", "questions", params.clerkId, params.page, params.pageSize],
        queryFn: () => getUserQuestions(params),
        enabled: !!params.clerkId,
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 5,
    });
}

export function useUserAnswers(params: GetUserStatsParams) {
    return useQuery({
        queryKey: ["user", "answers", params.clerkId, params.page, params.pageSize],
        queryFn: () => getUserAnswers(params),
        enabled: !!params.clerkId,
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 5,
    });
}

export function useToggleSaveQuestion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: ToggleSaveQuestionParams) => toggleSaveQuestion(params),
        onSuccess: (data, variables) => {
            // Invalidate saved questions queries
            queryClient.invalidateQueries({ queryKey: ["user", "saved-questions"] });
            // Invalidate the specific question's saved status
            queryClient.invalidateQueries({ queryKey: ["question-saved", variables.questionId] });
        },
    });
}

export function useIsQuestionSaved(clerkId: string, questionId: number) {
    return useQuery({
        queryKey: ["question-saved", questionId, clerkId],
        queryFn: () => checkIsQuestionSaved(clerkId, questionId),
        enabled: !!clerkId && !!questionId,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    });
}

export function useGetAllUsers(params: GetAllUsersParams) {
    return useQuery({
        queryKey: ["users", "all", params.page, params.pageSize, params.filter, params.searchQuery],
        queryFn: () => getAllUsers(params),
        staleTime: 1000 * 60 * 2,
        gcTime: 1000 * 60 * 5,
    });
}
