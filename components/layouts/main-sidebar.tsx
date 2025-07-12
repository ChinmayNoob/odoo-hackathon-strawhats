"use client";
import { sidebarLinks } from "@/constants";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
    SignedIn,
    SignedOut,
    SignInButton,
    SignOutButton,
    SignUpButton,
    useAuth,
} from "@clerk/nextjs";
import { Button } from "../ui/button";

const LeftSideBar = () => {
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { userId } = useAuth();
    const [links, setLinks] = useState(sidebarLinks);

    // Prevent hydration mismatch by only rendering after component mounts
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (userId) {
            setLinks((prevLinks) =>
                prevLinks.map((link) =>
                    link.route === "/profile"
                        ? { ...link, route: `${link.route}/${userId}` }
                        : link
                )
            );
        } else {
            setLinks((prevLinks) =>
                prevLinks.map((link) =>
                    link.route.includes("/profile")
                        ? { ...link, route: "/profile" }
                        : link
                )
            );

            // Only redirect if we're on the edit profile page and not logged in
            if (pathname === "/profile/edit") {
                router.push("/");
            }
        }
    }, [userId, pathname, router]);

    // Return a skeleton version before mounting to prevent hydration mismatch
    if (!mounted) {
        return (
            <section className="sticky left-0 top-0 flex h-screen flex-col justify-between overflow-y-auto bg-light-1 p-6 pt-36 dark:bg-dark-2 max-sm:hidden lg:w-[280px]">
                <div className="flex flex-1 flex-col gap-4">
                    {sidebarLinks.map((item, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-start gap-2 bg-transparent px-4 py-3"
                        >
                            <div className="size-[30px] bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse max-lg:hidden w-24" />
                        </div>
                    ))}
                </div>
                <div className="h-[41px] bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            </section>
        );
    }

    return (
        <section className="sticky left-0 top-0 flex h-screen flex-col justify-between overflow-y-auto bg-light-1 p-6 pt-36 dark:bg-dark-2 max-sm:hidden lg:w-[280px]">
            <div className="flex flex-1 flex-col gap-4">
                {links.map((item) => {
                    // takes array from sideBarLinks and creats a Link for each object in array for the sidebar

                    const isActive =
                        (pathname.includes(item.route) && item.route.length > 1) ||
                        pathname === item.route;
                    // to set a link to Active. It is true when the path name includes value of item route AND when value of route must have some data

                    if (item.route === "/profile") {
                        if (userId) {
                            item.route = `${item.route}/${userId}`;
                        } else {
                            return null;
                        }
                    }

                    return (
                        <Link
                            key={item.route}
                            href={item.route}
                            className={`${isActive
                                ? "rounded-lg bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                                : "text-zinc-500 dark:text-zinc-400"
                                } flex items-center justify-start gap-2 bg-transparent px-4 py-3 transition-colors`}
                        >
                            {/* checks if the link is active using isActive if yes apply needed classes */}
                            {item.icon ? (
                                <item.icon
                                    size={30}
                                    className={`${isActive ? "" : "text-zinc-500 dark:text-zinc-400"}`}
                                />
                            ) : (
                                <Image
                                    src={item.imgURL!}
                                    width={30}
                                    height={30}
                                    alt={item.label}
                                    className="invert dark:invert-0"
                                />
                            )}
                            <p
                                className={`${isActive
                                    ? "font-bold"
                                    : "font-medium"
                                    } text-lg max-lg:hidden`}
                            >
                                {item.label}
                            </p>
                        </Link>
                    );
                })}
            </div>
            <SignedIn>
                <SignOutButton>
                    <Button className="min-h-[41px] w-full rounded-lg px-4 py-3 text-sm font-medium ">
                        <Image
                            src="/assets/icons/logout.svg"
                            alt="login"
                            width={26}
                            height={26}
                            className="lg:hidden "
                        />
                        <span className="max-lg:hidden">
                            Sign-out
                        </span>
                    </Button>
                </SignOutButton>
            </SignedIn>
            <SignedOut>
                {/* if user is not logged in the content inside this will show */}
                <div className="flex flex-col gap-3">
                    <SignInButton mode="modal">
                        <Button className="min-h-[41px] w-full rounded-lg px-4 py-3 text-sm font-medium ">
                            <Image
                                src="/assets/icons/account.svg"
                                alt="login"
                                width={26}
                                height={26}
                                className="lg:hidden "
                            />
                            <span className="">
                                LogIn
                            </span>
                        </Button>
                    </SignInButton>

                    <SignUpButton mode="modal">
                        <Button className="min-h-[41px] w-full rounded-lg px-4 py-3 text-sm font-medium">
                            <Image
                                src="/assets/icons/sign-up.svg"
                                alt="signup"
                                width={26}
                                height={26}
                                className="lg:hidden "
                            />
                            <span className="max-lg:hidden">SignUp</span>
                        </Button>
                    </SignUpButton>
                </div>
            </SignedOut>
        </section>
    );
};

export default LeftSideBar;
