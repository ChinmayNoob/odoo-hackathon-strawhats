'use client'

import React, { useRef } from "react";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { AnswerSchema } from "@/lib/schema-types";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useCreateAnswer } from "@/lib/axios/answers";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { getUserByClerkId } from "@/lib/actions/users";
import { Editor } from "@tinymce/tinymce-react";

interface CreateAnswerProps {
    questionId: number;
}

const CreateAnswer = ({ questionId }: CreateAnswerProps) => {
    const pathname = usePathname();
    const { user } = useUser();
    const editorRef = useRef(null);
    const createAnswerMutation = useCreateAnswer();

    const form = useForm<z.infer<typeof AnswerSchema>>({
        resolver: zodResolver(AnswerSchema),
        defaultValues: {
            answer: "",
        },
    });

    const handleCreateAnswer = async (values: z.infer<typeof AnswerSchema>) => {
        if (!user) {
            toast.error("Please sign in to submit an answer");
            return;
        }

        try {
            // Get user from database
            const userResult = await getUserByClerkId(user.id);
            if (!userResult.success) {
                toast.error("User not found");
                return;
            }

            const result = await createAnswerMutation.mutateAsync({
                content: values.answer,
                authorId: userResult.user!.id,
                questionId,
                path: pathname,
            });

            if (result.success) {
                form.reset();
                // Clear TinyMCE editor after submitting answer
                if (editorRef.current) {
                    const editor = editorRef.current as { setContent: (content: string) => void };
                    editor.setContent("");
                }
                toast.success("Answer submitted successfully!");
            } else {
                toast.error(result.error || "Failed to submit answer");
            }
        } catch (error) {
            console.error("Error submitting answer:", error);
            toast.error("Failed to submit answer. Please try again.");
        }
    };

    if (!user) {
        return (
            <div className="mt-8 p-6 border border-[#cbcbcb] dark:border-[#212734] rounded-lg bg-[#F4F6F8] dark:bg-[#151821]">
                <h4 className="text-lg font-semibold text-[#000000] dark:text-[#FFFFFF] mb-2">
                    Submit an Answer
                </h4>
                <p className="text-[#5C5C7B] dark:text-[#858EAD] mb-4">
                    Please sign in to submit an answer to this question.
                </p>
                <Button className="primary-gradient text-light900_dark100">
                    Sign In
                </Button>
            </div>
        );
    }

    return (
        <div className="mt-8">
            <h4 className="text-lg font-semibold text-[#000000] dark:text-[#FFFFFF] mb-6">
                Your Answer
            </h4>

            <Form {...form}>
                <form
                    className="flex w-full flex-col gap-6"
                    onSubmit={form.handleSubmit(handleCreateAnswer)}
                >
                    <FormField
                        control={form.control}
                        name="answer"
                        render={({ field }) => (
                            <FormItem className="flex w-full flex-col">
                                <FormControl className="mt-3.5">
                                    <Editor
                                        apiKey={process.env.NEXT_PUBLIC_TINY_EDITOR_API_KEY}
                                        onInit={(_evt, editor) =>
                                            (editorRef.current = editor)
                                        }
                                        onBlur={field.onBlur}
                                        onEditorChange={(content) => field.onChange(content)}
                                        init={{
                                            height: 350,
                                            menubar: false,
                                            plugins: [
                                                "advlist",
                                                "autolink",
                                                "lists",
                                                "link",
                                                "image",
                                                "charmap",
                                                "preview",
                                                "anchor",
                                                "searchreplace",
                                                "visualblocks",
                                                "codesample",
                                                "fullscreen",
                                                "insertdatetime",
                                                "media",
                                                "table",
                                                "code",
                                            ],
                                            toolbar:
                                                "undo redo | blocks | " +
                                                "codesample | bold italic forecolor | alignleft aligncenter " +
                                                "alignright alignjustify | bullist numlist | ",
                                            content_style: "body { font-family:Inter; font-size:16px }",
                                            skin: "oxide",
                                            content_css: "light",
                                        }}
                                    />
                                </FormControl>
                                <div className="flex justify-between items-center mt-2">
                                    <FormMessage className="text-red-500" />
                                    <span className="text-sm text-[#5C5C7B] dark:text-[#858EAD]">
                                        {field.value?.length || 0} characters
                                    </span>
                                </div>
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            className="primary-gradient text-light900_dark100 px-8 py-2"
                            disabled={createAnswerMutation.isPending}
                        >
                            {createAnswerMutation.isPending ? "Submitting..." : "Submit Answer"}
                        </Button>
                    </div>
                </form>
            </Form>

            <div className="mt-4 p-4 border border-[#cbcbcb] dark:border-[#212734] rounded-lg bg-[#F8F9FA] dark:bg-[#1C1E2A]">
                <h5 className="font-semibold text-[#000000] dark:text-[#FFFFFF] mb-2">Tips for a great answer:</h5>
                <ul className="text-sm text-[#5C5C7B] dark:text-[#858EAD] space-y-1">
                    <li>• Be clear and concise</li>
                    <li>• Provide examples when helpful</li>
                    <li>• Use proper formatting for code</li>
                    <li>• Answer the question directly</li>
                    <li>• Be respectful and constructive</li>
                </ul>
            </div>
        </div>
    );
};

export default CreateAnswer;
