"use client";

import React from "react";
import Link from "next/link";
import RenderTag from "../common/render-tags";
import { ChevronRightIcon } from "lucide-react";
import { useTopQuestions } from "@/lib/axios/questions";
import { useTopPopularTags } from "@/lib/axios/tags";

const RightSideBar = () => {
    const { data: topQuestions, isLoading, error } = useTopQuestions();
    const { data: popularTags, isLoading: tagsLoading, error: tagsError } = useTopPopularTags();

    return (
        <section className=" background-light850_dark100 light-border sticky right-0 top-0 flex h-screen w-[310px]  flex-col overflow-y-auto p-6 pt-36 max-xl:hidden">
            <div className="light-border-2 rounded-lg border px-3 py-4">
                <h3 className="h3-bold text-dark200_light900 ">Top questions</h3>
                <div className="mt-7 flex w-full flex-col gap-2">
                    {isLoading ? (
                        <div className="text-dark100_light900 text-sm">Loading top questions...</div>
                    ) : error ? (
                        <div className="text-red-500 text-sm">Failed to load questions</div>
                    ) : topQuestions && topQuestions.length > 0 ? (
                        topQuestions.map((question) => (
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
                        ))
                    ) : (
                        <div className="text-dark100_light900 text-sm">No questions available</div>
                    )}
                </div>
            </div>
            <div className="light-border-2 mt-4 rounded-lg border px-3 py-4">
                <h3 className="h3-bold text-dark200_light900">Popular Tags</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                    {tagsLoading ? (
                        <div className="text-dark100_light900 text-sm">Loading popular tags...</div>
                    ) : tagsError ? (
                        <div className="text-red-500 text-sm">Failed to load tags</div>
                    ) : popularTags && popularTags.length > 0 ? (
                        popularTags.map((tag) => (
                            <RenderTag
                                key={tag.id}
                                _id={tag.id.toString()}
                                name={tag.name}
                                totalQuestions={tag.numberOfQuestions}
                            />
                        ))
                    ) : (
                        <div className="text-dark100_light900 text-sm">No tags available</div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default RightSideBar;
