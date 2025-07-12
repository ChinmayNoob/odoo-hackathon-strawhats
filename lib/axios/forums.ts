import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    createforum,
    editforum,
    deleteforum,
    joinforum,
    leaveforum,
    getforumById,
    getAllforums,
    getforumQuestions,
    getUserforums,
    getforumMembers,
    getPopularforums,
    askQuestionInforum,
    isUserMemberOfforum, // Add this import
} from "@/lib/actions/forums";
import {
    CreateforumParams,
    EditforumParams,
    DeleteforumParams,
    JoinforumParams,
    LeaveforumParams,
    GetforumByIdParams,
    GetAllforumsParams,
    GetforumQuestionsParams,
    GetUserforumsParams,
    GetforumMembersParams,
    AskQuestionInforumParams,
} from "@/lib/actions/shared.types";

// Create forum
export const useCreateforum = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: CreateforumParams) => createforum(params),
        onSuccess: (data) => {
            if (data.success) {
                // Invalidate forums list queries
                queryClient.invalidateQueries({ queryKey: ["forums"] });
                queryClient.invalidateQueries({ queryKey: ["user-forums"] });
            }
        },
    });
};

// Edit forum
export const useEditforum = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: EditforumParams) => editforum(params),
        onSuccess: (data, variables) => {
            if (data.success) {
                // Invalidate specific forum and forums list
                queryClient.invalidateQueries({ queryKey: ["forum", variables.forumId] });
                queryClient.invalidateQueries({ queryKey: ["forums"] });
            }
        },
    });
};

// Delete forum
export const useDeleteforum = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: DeleteforumParams) => deleteforum(params),
        onSuccess: (data, variables) => {
            if (data.success) {
                // Remove forum from cache and invalidate lists
                queryClient.removeQueries({ queryKey: ["forum", variables.forumId] });
                queryClient.invalidateQueries({ queryKey: ["forums"] });
                queryClient.invalidateQueries({ queryKey: ["user-forums"] });
            }
        },
    });
};

// Join forum
export const useJoinforum = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: JoinforumParams) => joinforum(params),
        onSuccess: (data, variables) => {
            if (data.success) {
                // Invalidate forum data and user's forums
                queryClient.invalidateQueries({ queryKey: ["forum", variables.forumId] });
                queryClient.invalidateQueries({ queryKey: ["user-forums"] });
                // Invalidate membership status
                queryClient.invalidateQueries({
                    queryKey: ["forum-membership", variables.forumId, variables.userId]
                });
                // Invalidate forum members list
                queryClient.invalidateQueries({
                    queryKey: ["forum-members", variables.forumId]
                });
            }
        },
    });
};

// Leave forum
export const useLeaveforum = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: LeaveforumParams) => leaveforum(params),
        onSuccess: (data, variables) => {
            if (data.success) {
                // Invalidate forum data and user's forums
                queryClient.invalidateQueries({ queryKey: ["forum", variables.forumId] });
                queryClient.invalidateQueries({ queryKey: ["user-forums"] });
                // Invalidate membership status
                queryClient.invalidateQueries({
                    queryKey: ["forum-membership", variables.forumId, variables.userId]
                });
                // Invalidate forum members list
                queryClient.invalidateQueries({
                    queryKey: ["forum-members", variables.forumId]
                });
            }
        },
    });
};

// Get forum by ID
export const useGetforumById = (params: GetforumByIdParams) => {
    return useQuery({
        queryKey: ["forum", params.forumId],
        queryFn: () => getforumById(params),
        enabled: !!params.forumId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
    });
};

// Get All forums
export const useGetAllforums = (params: GetAllforumsParams) => {
    return useQuery({
        queryKey: ["forums", params.searchQuery, params.filter, params.page, params.pageSize],
        queryFn: () => getAllforums(params),
        staleTime: 1000 * 60 * 2, // 2 minutes
        gcTime: 1000 * 60 * 5, // 5 minutes
    });
};

// Get forum Questions
export const useGetforumQuestions = (params: GetforumQuestionsParams) => {
    return useQuery({
        queryKey: ["forum-questions", params.forumId, params.searchQuery, params.filter, params.page, params.pageSize],
        queryFn: () => getforumQuestions(params),
        enabled: !!params.forumId,
        staleTime: 1000 * 60 * 2, // 2 minutes
        gcTime: 1000 * 60 * 5, // 5 minutes
    });
};

// Get User forums
export const useGetUserforums = (params: GetUserforumsParams) => {
    return useQuery({
        queryKey: ["user-forums", params.userId, params.page, params.pageSize],
        queryFn: () => getUserforums(params),
        enabled: !!params.userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
    });
};

// Get forum Members
export const useGetforumMembers = (params: GetforumMembersParams) => {
    return useQuery({
        queryKey: ["forum-members", params.forumId, params.page, params.pageSize],
        queryFn: () => getforumMembers(params),
        enabled: !!params.forumId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
    });
};

// Get Popular forums
export const useGetPopularforums = (limit?: number) => {
    return useQuery({
        queryKey: ["popular-forums", limit],
        queryFn: () => getPopularforums(limit),
        staleTime: 1000 * 60 * 10, // 10 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
    });
};

// Ask Question in forum
export const useAskQuestionInforum = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: AskQuestionInforumParams) => askQuestionInforum(params),
        onSuccess: (data, variables) => {
            if (data.success) {
                // Invalidate forum questions and related queries
                queryClient.invalidateQueries({ queryKey: ["forum-questions", variables.forumId] });
                queryClient.invalidateQueries({ queryKey: ["questions"] });
            }
        },
    });
};

// Check if user is a member of a forum
export const useCheckforumMembership = (forumId: number, userId: number | undefined) => {
    return useQuery({
        queryKey: ["forum-membership", forumId, userId],
        queryFn: () => isUserMemberOfforum(forumId, userId!),
        enabled: !!forumId && !!userId,
        staleTime: 1000 * 60 * 30, // 30 minutes
        gcTime: 1000 * 60 * 60, // 1 hour
        refetchOnWindowFocus: false, // Don't refetch when window regains focus
        refetchOnReconnect: false, // Don't refetch when reconnecting
        retry: false, // Don't retry on failure
    });
};