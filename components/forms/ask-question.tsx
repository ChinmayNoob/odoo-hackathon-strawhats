"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import React, { useRef, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import Image from "next/image";
import { useCreateQuestion } from "@/lib/axios/questions";
import { usePathname, useRouter } from "next/navigation";
import { Loader } from "lucide-react";

const QuestionSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters").max(130),
    content: z.string().min(20, "Content must be at least 20 characters"),
    tags: z.array(z.string().min(1).max(15)).min(0).max(3),
});

interface Props {
    userId: number;
}

const Question = ({ userId }: Props) => {
    const editorRef = useRef(null);
    const [tagInputValue, setTagInputValue] = useState("");
    const router = useRouter();
    const pathname = usePathname();

    const createQuestionMutation = useCreateQuestion();

    const form = useForm<z.infer<typeof QuestionSchema>>({
        resolver: zodResolver(QuestionSchema),
        defaultValues: {
            title: "",
            content: "",
            tags: [],
        },
    });

    async function onSubmit(values: z.infer<typeof QuestionSchema>) {
        try {
            const result = await createQuestionMutation.mutateAsync({
                title: values.title,
                content: values.content,
                tags: values.tags,
                authorId: userId,
                path: pathname,
            });

            if (result.success) {
                router.push("/");
            } else {
                console.error("Error creating question:", result.error);
            }
        } catch (error) {
            console.error("Error creating question:", error);
        }
    };

    const handleInputKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>,
        field: { name: string; value: string[] }
    ) => {
        if (e.key === "Enter" && field.name === "tags") {
            e.preventDefault();

            const tagValue = tagInputValue.trim();

            if (tagValue !== "") {
                if (tagValue.length > 15) {
                    return form.setError("tags", {
                        type: "required",
                        message: "Tag must be less than 15 characters",
                    });
                }

                // Normalize tag to uppercase to prevent duplicates
                const normalizedTag = tagValue.toUpperCase();

                // Ensure field.value is an array
                const currentTags = Array.isArray(field.value) ? field.value : [];

                // Check for duplicates using normalized values
                const normalizedCurrentTags = currentTags.map((tag: string) => tag.toUpperCase());

                if (!normalizedCurrentTags.includes(normalizedTag)) {
                    form.setValue("tags", [...currentTags, normalizedTag]);
                    setTagInputValue("");
                    form.clearErrors("tags");
                } else {
                    form.setError("tags", {
                        type: "required",
                        message: "This tag already exists",
                    });
                }
            } else {
                form.trigger();
            }
        }
    };

    const handleTagRemove = (tag: string, field: { value: string[] }) => {
        // Safely ensure field.value is an array before filtering
        const currentTags = Array.isArray(field.value) ? field.value : [];
        const newTags = currentTags.filter((t: string) => t !== tag);
        form.setValue("tags", newTags);

        // Trigger validation after removing a tag to show immediate feedback
        form.trigger("tags");
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex w-full flex-col gap-10"
            >
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem className="flex w-full flex-col">
                            <FormLabel className="text-base font-semibold text-gray-700 dark:text-gray-300">
                                Question Title <span className="text-red-600">*</span>
                            </FormLabel>
                            <FormControl className="mt-3.5">
                                <Input
                                    className="w-full min-h-[56px] px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription className="text-sm text-gray-600 dark:text-gray-400 mt-2.5">
                                Be specific and ask the question as if you&apos;re asking it to
                                another person
                            </FormDescription>
                            <FormMessage className="text-red-600" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem className="flex w-full flex-col gap-3">
                            <FormLabel className="text-base font-semibold text-gray-700 dark:text-gray-300">
                                Detailed explanation of your problem{" "}
                                <span className="text-red-600">*</span>
                            </FormLabel>
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
                            <FormDescription className="text-sm text-gray-600 dark:text-gray-400 mt-2.5">
                                Include as many details as possible. The more you tell us, the
                                easier it will be for others to help you.
                            </FormDescription>
                            <FormMessage className="text-red-500" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                        <FormItem className="flex w-full flex-col">
                            <FormLabel className="text-base font-semibold text-gray-700 dark:text-gray-300">
                                Tags
                            </FormLabel>
                            <FormControl className="mt-3.5">
                                <div>
                                    <Input
                                        placeholder="Add tags..."
                                        className="w-full min-h-[56px] px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        onKeyDown={(e) => handleInputKeyDown(e, field)}
                                        value={tagInputValue}
                                        onChange={(e) => setTagInputValue(e.target.value)}
                                    />
                                    {field.value && field.value.length > 0 && (
                                        <div className="flex flex-wrap items-start gap-2 mt-3">
                                            {field.value.map((tag: string) => (
                                                <div
                                                    key={tag}
                                                    className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                    onClick={() => handleTagRemove(tag, field)}
                                                >
                                                    <span className="capitalize">{tag}</span>
                                                    <Image
                                                        src="/assets/icons/close.svg"
                                                        alt="Remove tag"
                                                        className="cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
                                                        width={12}
                                                        height={12}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </FormControl>
                            <FormDescription className="text-sm text-gray-600 dark:text-gray-400 mt-2.5">
                                Add up to 3 tags to help others find your question (optional). Press Enter after typing each tag.
                            </FormDescription>
                            <FormMessage className="text-red-500" />
                        </FormItem>
                    )}
                />
                <Button
                    type="submit"
                    className="w-fit px-6 py-3 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={createQuestionMutation.isPending}
                >
                    {createQuestionMutation.isPending ? (
                        <>
                            <Loader className="w-4 h-4 animate-spin mr-2" />
                            Posting...
                        </>
                    ) : (
                        "Post question"
                    )}
                </Button>
            </form>
        </Form>
    );
};

export default Question; 