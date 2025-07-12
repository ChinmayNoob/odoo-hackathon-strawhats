'use client'

import { useAuth } from "@clerk/nextjs";
import Profile from "@/components/profile/profile";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useUserByClerkId } from "@/lib/axios/users";

const ProfileEdit = () => {
    const { userId } = useAuth();
    const { data: userResult, isLoading } = useUserByClerkId(userId || '');

    if (!userId) return <div>No user found</div>;
    if (isLoading) return <div>Loading...</div>;


    if (!userResult?.user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="w-full">
            <div className="text-[#000000] dark:text-[#FFFFFF] mt-1 flex w-full flex-col px-6 pb-2 pt-4 sm:px-12">
                <div className="flex items-start justify-start mb-4">
                    <Link href={`/profile/${userResult.user.clerkId}`}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-2 text-[#5C5C7B] dark:text-[#858EAD] hover:text-[#000000] dark:hover:text-[#FFFFFF] px-0 h-auto"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Profile
                        </Button>
                    </Link>
                </div>
                <div className="flex flex-col items-start justify-start">
                    <h1 className="text-lg font-semibold">Edit Profile</h1>
                    <p className="text-[#5C5C7B] dark:text-[#858EAD]">Update your profile information</p>
                </div>
            </div>

            <div className="px-6 sm:px-12 pt-8">
                <div className="border border-[#cbcbcb] dark:border-[#212734] bg-[#fdfdfd] dark:bg-[#09090A] rounded-lg p-6">
                    <Profile clerkId={userId} user={JSON.stringify(userResult.user)} />
                </div>
            </div>
        </div>
    );
};

export default ProfileEdit;
