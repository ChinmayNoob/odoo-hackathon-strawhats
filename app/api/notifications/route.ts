import { NextRequest, NextResponse } from "next/server";
import { getNotifications } from "@/lib/actions/notifications";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const userId = parseInt(searchParams.get("userId") || "0");
        const page = parseInt(searchParams.get("page") || "1");
        const pageSize = parseInt(searchParams.get("pageSize") || "20");

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        const result = await getNotifications({ userId, page, pageSize });
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error in notifications GET route:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 