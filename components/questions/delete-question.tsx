"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useDeleteQuestion } from "@/lib/axios/questions";
import { useCurrentUser } from "@/lib/axios/users";
import { useRouter, usePathname } from "next/navigation";
import { Loader, Trash2 } from "lucide-react";

interface Props {
    questionId: number;
}

const DeleteQuestion = ({ questionId }: Props) => {
    const router = useRouter();
    const pathname = usePathname();
    const deleteQuestionMutation = useDeleteQuestion();
    const { data: currentUser } = useCurrentUser();

    const handleDelete = async () => {
        if (!currentUser?.success || !currentUser.user) {
            console.error("User not authenticated");
            return;
        }

        try {
            const result = await deleteQuestionMutation.mutateAsync({
                questionId,
                userId: currentUser.user.id,
                path: pathname,
            });

            if (result.success) {
                router.push("/");
            } else {
                console.error("Error deleting question:", result.error);
            }
        } catch (error) {
            console.error("Error deleting question:", error);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 hover:border-red-600 hover:text-red-600 flex items-center gap-2"
                    disabled={deleteQuestionMutation.isPending}
                >
                    {deleteQuestionMutation.isPending ? (
                        <Loader className="size-4 animate-spin" />
                    ) : (
                        <Trash2 className="size-4" />
                    )}
                    Delete Question
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        question and remove all associated data including votes, tags, and interactions
                        from our servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleteQuestionMutation.isPending}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={deleteQuestionMutation.isPending}
                        className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                    >
                        {deleteQuestionMutation.isPending ? (
                            <>
                                <Loader className="size-4 animate-spin mr-2" />
                                Deleting...
                            </>
                        ) : (
                            "Delete Question"
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DeleteQuestion; 