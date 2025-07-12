'use client'

import { Button } from "@/components/ui/button";
import { getJoinedDate } from "@/lib/utils";
import { SignedIn, useAuth } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import ProfileLink from "@/components/profile/profile-link";
import ProfileTabs from "@/components/profile/profile-tabs";
import { useUserInfo } from "@/lib/axios/users";
import { use } from "react";
import { PiScribbleLoopBold } from "react-icons/pi";

interface PageParams {
    id: string;
}

const ProfileDetails = ({ params }: { params: Promise<PageParams> }) => {
    const { userId: clerkId } = useAuth();
    const unwrappedParams = use(params);
    const { data: userInfo, isLoading } = useUserInfo(unwrappedParams.id);
    console.log(userInfo);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    const { user, totalQuestions, totalAnswers, reputation } = userInfo || {};

    if (!user) {
        return <div>User not found</div>;
    }

    return (
        <div className="w-full">
            <div className="text-[#000000] dark:text-[#FFFFFF] mt-1 flex w-full flex-col px-6 pb-2 pt-4 sm:px-12">
                <h1 className="text-lg font-semibold">{user.name}</h1>
                <p className="text-[#5C5C7B] dark:text-[#858EAD]">Stats - {reputation}</p>
            </div>
            <div className="flex items-center justify-center relative h-[200px] w-full bg-[#eeeeee] dark:bg-[#151821]">
                <div className="flex min-w-11 items-center gap-1 sm:min-w-32">
                    <PiScribbleLoopBold size={50} />

                    <p className="font-spaceGrotesk font-bold text-[#000000] dark:text-[#FFFFFF] max-sm:text-4xl sm:text-5xl md:text-6xl">
                        StackIt
                    </p>
                </div>
                <div className="absolute left-6 top-full -translate-y-1/2 z-10">
                    <div className="w-28 h-28 overflow-hidden rounded-full border-4 border-[#FFFFFF] dark:border-[#151821] bg-[#FFFFFF] dark:bg-[#151821]">
                        <Image
                            src={user?.picture}
                            alt="profile picture"
                            width={128}
                            height={128}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
                <SignedIn>
                    {clerkId === user.clerkId && (
                        <Link
                            href="/profile/edit"
                            className="absolute -bottom-8 right-6"
                        >
                            <Button className="text-base font-medium leading-[22.4px] border border-[#cbcbcb] dark:border-[#212734] text-[#000000] dark:text-[#FFFFFF] bg-neutral-100 dark:bg-[#212734] hover:bg-[#F4F6F8] dark:hover:bg-[#151821] min-h-[46px] rounded-full px-6 py-3 transition-colors">
                                Edit profile
                            </Button>
                        </Link>
                    )}
                </SignedIn>
            </div>
            <div className="flex flex-col-reverse items-start justify-between px-6 pt-12 sm:flex-row sm:px-10">
                <div className="flex flex-col items-start gap-4 lg:flex-row">
                    <div className="mt-3">
                        <h2 className="text-2xl font-bold leading-[31.2px] text-[#000000] dark:text-[#FFFFFF] mb-2">{user.name}</h2>
                        <p className="text-base font-normal leading-[22.4px] text-[#5C5C7B] dark:text-[#858EAD] mb-4">
                            @{user.username}
                        </p>
                        <div className="mt-5 flex w-full flex-wrap items-center gap-5">
                            <ProfileLink
                                imgUrl="/assets/icons/calendar.svg"
                                title={getJoinedDate(user.joinedAt)}
                            />
                            {user.location && (
                                <ProfileLink
                                    imgUrl="/assets/icons/location.svg"
                                    title={user.location}
                                />
                            )}
                        </div>
                        {user.portfolioProfile && (
                            <div className="mt-3 w-full">
                                <ProfileLink
                                    imgUrl="/assets/icons/link.svg"
                                    href={user.portfolioProfile}
                                    title="Portfolio Profile"
                                />
                            </div>
                        )}
                        {user.bio && (
                            <p className="text-base font-normal leading-[22.4px] text-[#212734] dark:text-[#DCE3F1] mt-6 max-w-2xl">
                                {user.bio}
                            </p>
                        )}
                    </div>
                </div>
            </div>
            <div className="border border-[#cbcbcb] dark:border-[#212734] border-t bg-[#fdfdfd] dark:bg-[#09090A] text-[#000000] dark:text-[#FFFFFF] mx-auto mt-8 mb-8 flex w-[90%] flex-col items-start justify-center px-6 py-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-[#000000] dark:text-[#FFFFFF]">Activity Stats</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    <div className="flex flex-col">
                        <span className="text-sm text-[#5C5C7B] dark:text-[#858EAD] mb-1">Total Questions</span>
                        <span className="text-xl font-semibold text-[#FF7000]">{totalQuestions}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm text-[#5C5C7B] dark:text-[#858EAD] mb-1">Total Answers</span>
                        <span className="text-xl font-semibold text-[#FF7000]">{totalAnswers}</span>
                    </div>
                </div>
            </div>

            {/* Profile Tabs for Questions and Answers */}
            <div className="mx-auto w-[90%] mb-8">
                <ProfileTabs
                    clerkId={user.clerkId}
                    isOwnProfile={clerkId === user.clerkId}
                />
            </div>
        </div>
    );
};

export default ProfileDetails;
