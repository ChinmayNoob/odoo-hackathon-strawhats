import { NextRequest, NextResponse } from "next/server";
import { getUnreadCount } from "@/lib/actions/notifications";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const userId = parseInt(searchParams.get("userId") || "0");

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        const count = await getUnreadCount(userId);
        return NextResponse.json({ count });
    } catch (error) {
        console.error("Error in unread count GET route:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 