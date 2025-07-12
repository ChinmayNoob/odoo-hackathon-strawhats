'use client';

import { SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import Theme from "./theme-toggle";
import MobileNav from "./mobile-navbar";
import { useCurrentUser } from "@/lib/axios/users";
import { PiScribbleLoopBold } from "react-icons/pi";
import NotificationBell from "@/components/common/notifications/notification-bell";

const Navbar = () => {
    const [mounted, setMounted] = useState(false);
    const { data: userResult } = useCurrentUser();

    // Prevent hydration mismatch by only rendering after component mounts
    useEffect(() => {
        setMounted(true);
    }, []);

    // Dummy data for tags
    const allTags = {
        tags: [
            { id: 1, name: "JavaScript" },
            { id: 2, name: "React" },
            { id: 3, name: "TypeScript" },
            { id: 4, name: "Node.js" },
            { id: 5, name: "Next.js" }
        ]
    };

    const user = {
        id: userResult?.success && userResult.user ? userResult.user.id : 0,
        name: userResult?.success && userResult.user ? userResult.user.name : "",
        username: userResult?.success && userResult.user ? userResult.user.username : "",
        picture: userResult?.success && userResult.user ? userResult.user.picture : "",
    };

    // Return a skeleton version before mounting to prevent hydration mismatch
    if (!mounted) {
        return (
            <nav className="flex items-center justify-between fixed left-1/2 top-2 z-50 w-[95%] max-w-6xl -translate-x-1/2 gap-5 rounded-xl bg-zinc-300/40 px-4 py-2 shadow-light-300 backdrop-blur-md backdrop-saturate-150 dark:bg-dark-4/70 dark:shadow-none max-sm:w-[98%] max-sm:gap-1 sm:px-7">
                {/* Logo Section */}
                <Link href="/" className="flex items-center gap-1 min-w-11 sm:min-w-32">
                    <PiScribbleLoopBold size={28} />
                    <p className="font-spaceGrotesk font-bold text-2xl max-sm:hidden">
                        StackIt
                    </p>
                </Link>

                {/* Loading skeleton for right section */}
                <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                </div>
            </nav>
        );
    }

    return (
        <nav className="flex items-center justify-between fixed left-1/2 top-2 z-50 w-[95%] max-w-6xl -translate-x-1/2 gap-5 rounded-xl bg-zinc-300/40 px-4 py-2 shadow-light-300 backdrop-blur-md border-3 backdrop-saturate-150 dark:bg-neutral-950 dark:shadow-none max-sm:w-[98%] max-sm:gap-1 sm:px-7">
            {/* Logo Section */}
            <Link href="/" className="flex items-center gap-1 min-w-11 sm:min-w-32">
                <PiScribbleLoopBold size={28} />
                <p className="font-spaceGrotesk font-bold text-2xl max-sm:hidden">
                    StackIt
                </p>
            </Link>

            {/* Center Section - Mobile Only */}
            <div className="flex items-center justify-center gap-3 sm:hidden">
                <Theme />
                {user.id > 0 && <NotificationBell userId={user.id} />}
                <MobileNav user={user} popularTags={JSON.stringify(allTags?.tags)} />
            </div>

            {/* Right Section - Desktop */}
            <div className="flex items-center gap-3 max-sm:hidden">
                <Theme />
                {user.id > 0 && <NotificationBell userId={user.id} />}
                <SignedIn>
                    <UserButton
                        appearance={{
                            elements: {
                                avatarBox: "size-9",
                            },
                            variables: {
                                colorPrimary: "#ff7000",
                            },
                        }}
                    />
                </SignedIn>
            </div>
        </nav>
    );
};

export default Navbar;
