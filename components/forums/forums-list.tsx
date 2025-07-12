"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Users, MessageCircle, ChevronRight } from "lucide-react";
import { IoFilter } from "react-icons/io5";
import { forumWithStats } from "@/lib/actions/shared.types";
import Image from "next/image";
import Link from "next/link";
import { getTimestamp } from "@/lib/utils";

interface LoopsListProps {
    forums: forumWithStats[];
    isNext: boolean;
    searchQuery: string;
    filter: "newest" | "popular" | "active";
    page: number;
}

const LoopsList = ({
    forums,
    isNext,
    searchQuery,
    filter,
    page,
}: LoopsListProps) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState(searchQuery);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams);
        if (search) {
            params.set("q", search);
        } else {
            params.delete("q");
        }
        params.set("page", "1");
        router.push(`/loops?${params.toString()}`);
    };

    const handleFilterChange = (newFilter: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("filter", newFilter);
        params.set("page", "1");
        router.push(`/loops?${params.toString()}`);
    };

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", newPage.toString());
        router.push(`/loops?${params.toString()}`);
    };

    return (
        <div className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <form
                    onSubmit={handleSearch}
                    className="flex-1 relative w-full"
                >
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <Input
                            type="text"
                            placeholder="Search communities..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-28 py-3 h-12"
                        />
                        <Button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-4 py-2"
                        >
                            Search
                        </Button>
                    </div>
                </form>

                <div className="w-full sm:w-[200px]">
                    <Select value={filter} onValueChange={handleFilterChange}>
                        <SelectTrigger className="h-12">
                            <div className="flex items-center gap-2">
                                <IoFilter className="text-lg" />
                                <SelectValue placeholder="Sort by" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest</SelectItem>
                            <SelectItem value="popular">Most Popular</SelectItem>
                            <SelectItem value="active">Most Active</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Loops List (List View) */}
            {forums.length > 0 ? (
                <div className="space-y-4">
                    {forums.map((forum) => (
                        <ForumCard key={forum.id} forum={forum} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="mx-auto max-w-md">
                        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                            <Users size={48} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            No communities found
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            {searchQuery
                                ? "Try adjusting your search terms or creating a new community."
                                : "Be the first to create a community!"}
                        </p>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {forums.length > 0 && (
                <div className="flex justify-center items-center gap-4 mt-8">
                    <Button
                        variant="outline"
                        disabled={page === 1}
                        onClick={() => handlePageChange(page - 1)}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Page {page}
                    </span>
                    <Button
                        variant="outline"
                        disabled={!isNext}
                        onClick={() => handlePageChange(page + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
};

interface ForumCardProps {
    forum: forumWithStats;
}

const ForumCard = ({ forum }: ForumCardProps) => {
    return (
        <div className="w-full bg-white dark:bg-black border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-lg bg-black dark:bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                        {forum.picture ? (
                            <Image
                                src={forum.picture}
                                alt={forum.name}
                                width={56}
                                height={56}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-white dark:text-black font-bold text-xl">
                                {forum.name.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 truncate">
                            {forum.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            {getTimestamp(forum.createdAt)}
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 sm:line-clamp-1">
                            {forum.description}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                            <Users size={14} />
                            <span>{forum.memberCount} members</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <MessageCircle size={14} />
                            <span>{forum.questionCount} questions</span>
                        </div>
                    </div>

                    <Link href={`/forums/${forum.id}`}>
                        <Button variant="ghost" size="sm" className="h-9 px-4 gap-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                            <span className="text-sm font-medium">Forum In</span>
                            <ChevronRight size={16} />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default LoopsList;