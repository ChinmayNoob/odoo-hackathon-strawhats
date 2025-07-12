'use client'

import EditQuestion from "@/components/forms/edit-question";
import { useQuestionById } from "@/lib/axios/questions";
import { use } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";

interface PageParams {
    id: string;
}

const EditQuestionPage = ({ params }: { params: Promise<PageParams> }) => {
    const unwrappedParams = use(params);
    const { data: questionInfo, isLoading, error } = useQuestionById({ questionId: parseInt(unwrappedParams.id) });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7000]"></div>
            </div>
        );
    }

    if (error || !questionInfo) {
        return (
            <div className="flex items-center justify-center min-h-[400px] flex-col gap-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-[#000000] dark:text-[#FFFFFF] mb-2">Question not found</h2>
                    <p className="text-[#5C5C7B] dark:text-[#858EAD] mb-4">
                        The question you&apos;re looking for doesn&apos;t exist or has been removed.
                    </p>
                    <Link href="/">
                        <Button className="primary-gradient text-light900_dark100">
                            Back to Questions
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-10 px-6 sm:px-12">
            {/* Back Button */}
            <div className="mb-6">
                <Link href={`/question/${unwrappedParams.id}`}>
                    <Button variant="outline" className="border-[#cbcbcb] dark:border-[#212734] text-[#000000] dark:text-[#FFFFFF] hover:bg-[#F4F6F8] dark:hover:bg-[#151821] flex items-center gap-2">
                        <FaArrowLeft className="size-4" />
                        Back to Question
                    </Button>
                </Link>
            </div>

            <h1 className="h1-bold text-dark100_light900">Edit Question</h1>
            <div className="mt-9">
                <EditQuestion
                    questionId={questionInfo.id}
                    initialData={{
                        title: questionInfo.title,
                        content: questionInfo.content,
                        tags: questionInfo.tags,
                    }}
                />
            </div>
        </div>
    );
};

export default EditQuestionPage;
