"use client";

import React from "react";
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
import { useDeleteAnswer } from "@/lib/axios/answers";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { FaTrashAlt } from "react-icons/fa";

interface DeleteAnswerProps {
    answerId: number;
}

const DeleteAnswer = ({ answerId }: DeleteAnswerProps) => {
    const pathname = usePathname();
    const deleteAnswerMutation = useDeleteAnswer();

    const handleDelete = async () => {
        try {
            const result = await deleteAnswerMutation.mutateAsync({
                answerId,
                path: pathname,
            });

            if (result.success) {
                toast.success("Answer deleted successfully");
            } else {
                toast.error(result.error || "Failed to delete answer");
            }
        } catch (error) {
            console.error("Error deleting answer:", error);
            toast.error("Failed to delete answer");
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                    <FaTrashAlt className="size-4" />
                    Delete
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white dark:bg-[#151821] border border-[#cbcbcb] dark:border-[#212734]">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-[#000000] dark:text-[#FFFFFF]">
                        Delete Answer
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-[#5C5C7B] dark:text-[#858EAD]">
                        Are you sure you want to delete this answer? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="border-[#cbcbcb] dark:border-[#212734] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#F4F6F8] dark:hover:bg-[#151821]">
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={deleteAnswerMutation.isPending}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {deleteAnswerMutation.isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default DeleteAnswer; 