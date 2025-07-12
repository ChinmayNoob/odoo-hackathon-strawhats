"use client";

import Filter from "@/components/common/filter";
import Pagination from "@/components/common/pagination";
import { useGetforumMembers } from "@/lib/axios/forums";
import { useGetforumById } from "@/lib/axios/forums";
import Link from "next/link";
import React, { useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getTimestamp } from "@/lib/utils";
import { Shield, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const MemberFilters = [
    { name: "All Members", value: "all" },
    { name: "Admins", value: "admin" },
    { name: "Recent Joins", value: "recent" },
];

interface MemberCardProps {
    member: {
        id: number;
        clerkId: string;
        name: string;
        username: string;
        picture: string;
        reputation: number | null;
        role: string | null;
        joinedAt: Date;
    };
}

interface PageParams {
    id: string;
}

const MemberCard = ({ member }: MemberCardProps) => {
    return (
        <Link href={`/profile/${member.clerkId}`} className="block">
            <div className="background-light850_dark100 light-border-2 flex min-h-[200px] w-full flex-col items-center justify-center rounded-sm border p-6 hover:bg-zinc-200/10 dark:hover:bg-zinc-900/60">
                <div className="mb-3 size-[80px] overflow-hidden rounded-full">
                    <Image
                        src={member.picture || "/assets/icons/avatar.svg"}
                        alt="user profile picture"
                        className="size-full object-cover"
                        width={80}
                        height={80}
                    />
                </div>
                <div className="mt-2 text-center">
                    <h3 className="h3-bold text-dark200_light900 line-clamp-1">
                        {member.name}
                    </h3>
                    <p className="body-regular text-variant">@{member.username}</p>
                    <div className="mt-3 flex flex-col gap-2">
                        <div className="flex items-center justify-center gap-2 text-sm">
                            {member.role === "admin" ? (
                                <div className="flex items-center gap-1 text-blue-500">
                                    <Shield size={14} />
                                    <span>Admin</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-gray-500">
                                    <Clock size={14} />
                                    <span>Joined {getTimestamp(member.joinedAt)}</span>
                                </div>
                            )}
                        </div>
                        {member.reputation !== null && (
                            <div className="text-sm text-dark400_light700">
                                {member.reputation} Reputation
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
};

const ForumMembers = ({ params }: { params: Promise<PageParams> }) => {
    const router = useRouter();
    const unwrappedParams = use(params);
    const forumId = parseInt(unwrappedParams.id);
    const [filter, setFilter] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);

    const { data: forumInfo } = useGetforumById({ forumId });
    const { data: result, isLoading, error } = useGetforumMembers({
        forumId,
        page: currentPage,
        pageSize: 9,
        filter: filter as "all" | "admin" | "recent",
    });

    const handleFilterChange = (newFilter: string) => {
        setFilter(newFilter);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    if (isLoading) {
        return (
            <div className="px-6 sm:px-12">
                <div className="flex items-center mt-5">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4">
                        <ArrowLeft className="size-5" />
                    </Button>
                    <h1 className="h1-bold text-dark100_light900">Loop Members</h1>
                </div>
                <div className="mt-5 flex items-center justify-center">
                    <p className="paragraph-regular text-dark200_light800">Loading members...</p>
                </div>
            </div>
        );
    }

    if (error || !forumInfo) {
        return (
            <div className="px-6 sm:px-12">
                <div className="flex items-center mt-5">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4">
                        <ArrowLeft className="size-5" />
                    </Button>
                    <h1 className="h1-bold text-dark100_light900">Loop Members</h1>
                </div>
                <div className="mt-5 flex items-center justify-center">
                    <p className="paragraph-regular text-red-500">Error loading members. Please try again.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="px-6 sm:px-12">
            <div className="flex items-center justify-between mt-5">
                <div className="flex items-center">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-4">
                        <ArrowLeft className="size-5" />
                    </Button>
                    <h1 className="h1-bold text-dark100_light900">
                        {forumInfo.name} - Members ({forumInfo.memberCount})
                    </h1>
                </div>
                <Filter
                    filters={MemberFilters}
                    otherClasses="h-[30px]"
                    containerClasses="flex"
                    placeholder="Select a filter"
                    value={filter}
                    onValueChange={handleFilterChange}
                />
            </div>

            <section className="mt-8 grid w-full grid-cols-2 gap-3 max-sm:gap-1 md:grid-cols-3">
                {result && result.members.length > 0 ? (
                    result.members.map((member) => (
                        <MemberCard key={member.id} member={member} />
                    ))
                ) : (
                    <div className="paragraph-regular text-dark200_light800 mx-auto max-w-4xl text-center col-span-full">
                        <p>No members found</p>
                        <Link href={`/forums/${forumId}`} className="mt-2 font-bold text-accent-blue">
                            Join to be the first!
                        </Link>
                    </div>
                )}
            </section>

            {result && (
                <div className="mt-10">
                    <Pagination
                        pageNumber={currentPage}
                        isNext={result.isNext}
                        onPageChange={handlePageChange}
                    />
                </div>
            )}
        </div>
    );
};

export default ForumMembers; 