"use client";

import Link from "next/link";
import React, { use } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useGetAllforums } from "@/lib/axios/forums";
import { useUser } from "@clerk/nextjs";
import ForumsList from "@/components/forums/forums-list";

interface PageProps {
    searchParams: {
        q?: string;
        filter?: string;
        page?: string;
    };
}

const ForumsPage = ({ searchParams: searchParamsPromise }: { searchParams: Promise<PageProps['searchParams']> }) => {
    const { user: clerkUser, isLoaded } = useUser();
    const searchParams = use(searchParamsPromise);

    const searchQuery = searchParams.q ?? "";
    const filter = (searchParams.filter ?? "newest") as "newest" | "popular" | "active";
    const page = parseInt(searchParams.page ?? "1");

    const { data: forumsData, isLoading: isLoadingForums } = useGetAllforums({
        searchQuery,
        filter,
        page,
        pageSize: 20,
    });

    if (!isLoaded || isLoadingForums) {
        return <div>Loading...</div>; // You might want to use a proper loading component here
    }

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex flex-col gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Forums
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        Join programming forums and connect with like-minded developers
                    </p>
                </div>

                <div className="flex justify-start">
                    {clerkUser && (
                        <Link href="/forums/create">
                            <Button className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white">
                                <Plus size={16} />
                                Create Forum
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Forums List */}
            <ForumsList
                forums={forumsData?.forums || []}
                isNext={forumsData?.isNext || false}
                searchQuery={searchQuery}
                filter={filter}
                page={page}
            />
        </div>
    );
};

export default ForumsPage;