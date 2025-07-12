"use client";

import UserCard from "@/components/cards/user-card";
import Filter from "@/components/common/filter";
import Pagination from "@/components/common/pagination";
import { UserFilters } from "@/constants/filters";
import { useGetAllUsers } from "@/lib/axios/users";
import Link from "next/link";
import React, { useState } from "react";

const Community = () => {
    const [filter, setFilter] = useState<string>("new_users");
    const [currentPage, setCurrentPage] = useState(1);

    const { data: result, isLoading, error } = useGetAllUsers({
        filter,
        page: currentPage,
        pageSize: 9,
    });

    const handleFilterChange = (newFilter: string) => {
        setFilter(newFilter);
        setCurrentPage(1); // Reset to first page when filter changes
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    if (isLoading) {
        return (
            <div className="px-6 sm:px-12">
                <h1 className="h1-bold text-dark100_light900 mt-5">Community</h1>
                <div className="mt-5 flex items-center justify-center">
                    <p className="paragraph-regular text-dark200_light800">Loading users...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="px-6 sm:px-12">
                <h1 className="h1-bold text-dark100_light900 mt-5">Community</h1>
                <div className="mt-5 flex items-center justify-center">
                    <p className="paragraph-regular text-red-500">Error loading users. Please try again.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="px-6 sm:px-12">
            <div className="light-border-2 mt-2 flex items-center justify-between gap-5 border-b py-3 sm:items-center">
                <Filter
                    filters={UserFilters}
                    otherClasses="h-[30px]"
                    containerClasses="flex"
                    placeholder="Select a filter"
                    value={filter}
                    onValueChange={handleFilterChange}
                />
            </div>

            <h1 className="h1-bold text-dark100_light900 mt-5">Community</h1>

            <section className="mt-5 grid w-full grid-cols-2 gap-3 max-sm:gap-1 md:grid-cols-3">
                {result && result.users.length > 0 ? (
                    result.users.map((user) => <UserCard key={user.id} user={user} />)
                ) : (
                    <div className="paragraph-regular text-dark200_light800 mx-auto max-w-4xl text-center col-span-full">
                        <p>No users yet</p>
                        <Link href="/sign-up" className="mt-2 font-bold text-accent-blue">
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

export default Community;
