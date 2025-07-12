"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { createOrGetUserFromClerk } from "@/lib/actions/users";

export default function UserSync() {
    const { user, isLoaded } = useUser();
    const hasTriedSync = useRef(false);

    useEffect(() => {
        if (isLoaded && user && !hasTriedSync.current) {
            hasTriedSync.current = true;

            // Automatically create or get user from database when Clerk user is loaded
            createOrGetUserFromClerk()
                .then((result) => {
                    if (result.success) {
                        console.log("User synced successfully:");
                    } else {
                        console.error("Failed to sync user:", result.error);
                    }
                })
                .catch((error) => {
                    console.error("Failed to sync user with database:", error);
                });
        }

        // Reset flag when user changes or logs out
        if (!user) {
            hasTriedSync.current = false;
        }
    }, [isLoaded, user]);

    // This component doesn't render anything visible
    return null;
} 