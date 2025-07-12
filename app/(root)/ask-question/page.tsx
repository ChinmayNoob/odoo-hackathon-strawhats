import Question from "@/components/forms/ask-question";
import { getUserByClerkId } from "@/lib/actions/users";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import React from "react";

export const metadata: Metadata = {
    title: "Ask Question",
    description: "Ask a question page",
};


const AskQuestionPage = async () => {
    const { userId } = await auth();

    if (!userId) redirect("/sign-in");

    const user = await getUserByClerkId(userId);

    if (!user.success) {
        redirect("/sign-in");
    }

    return (
        <div className="mt-4 px-6 sm:px-12">
            <h1 className="text-2xl font-bold">Ask a question</h1>
            <div className="mt-9">
                <Question userId={user.user!.id} />
            </div>
        </div>
    );
};

export default AskQuestionPage;
