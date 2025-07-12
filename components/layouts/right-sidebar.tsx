"use client";

import React from "react";
import Link from "next/link";
import RenderTag from "../common/render-tags";
import { ChevronRightIcon } from "lucide-react";

// Dummy data for questions
const dummyQuestions = [
    { id: 1, title: "How to implement dark mode in Next.js?" },
    { id: 2, title: "What's the best way to handle state management in React?" },
    { id: 3, title: "How to optimize performance in a React application?" },
    { id: 4, title: "Understanding TypeScript generics in React components" },
    { id: 5, title: "Best practices for API route handling in Next.js" }
];

// Dummy data for tags
const dummyTags = [
    { id: 1, name: "react", numberOfQuestions: 150 },
    { id: 2, name: "nextjs", numberOfQuestions: 100 },
    { id: 3, name: "typescript", numberOfQuestions: 80 },
    { id: 4, name: "javascript", numberOfQuestions: 200 },
    { id: 5, name: "tailwindcss", numberOfQuestions: 50 }
];

const RightSideBar = () => {
    return (
        <section className=" background-light850_dark100 light-border sticky right-0 top-0 flex h-screen w-[310px]  flex-col overflow-y-auto p-6 pt-36 max-xl:hidden">
            <div className="light-border-2 rounded-lg border px-3 py-4">
                <h3 className="h3-bold text-dark200_light900 ">Top questions</h3>
                <div className="mt-7 flex w-full flex-col gap-2">
                    {dummyQuestions.map((question) => (
                        <Link
                            href={`/question/${question.id}`}
                            key={question.id}
                            className=" flex cursor-pointer items-center justify-between gap-3 rounded-md  p-2 hover:bg-zinc-200/30 dark:hover:bg-dark-4/60"
                        >
                            <p className="text-dark100_light900 line-clamp-2 w-full text-sm underline underline-offset-4">
                                {question.title}
                            </p>
                            <ChevronRightIcon className="h-4 w-4" />
                        </Link>
                    ))}
                </div>
            </div>
            <div className="light-border-2 mt-4 rounded-lg border px-3 py-4">
                <h3 className="h3-bold text-dark200_light900">Popular Tags</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                    {dummyTags.map((tag) => (
                        <RenderTag
                            key={tag.id}
                            _id={tag.id.toString()}
                            name={tag.name}
                            totalQuestions={tag.numberOfQuestions}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default RightSideBar;
