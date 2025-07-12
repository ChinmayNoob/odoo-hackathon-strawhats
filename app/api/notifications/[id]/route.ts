import { NextRequest, NextResponse } from "next/server";
import { markNotificationRead } from "@/lib/actions/notifications";

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const notificationId = parseInt(params.id);
        const { userId, path } = await req.json();

        if (!notificationId || !userId) {
            return NextResponse.json(
                { error: "Notification ID and User ID are required" },
                { status: 400 }
            );
        }

        const result = await markNotificationRead({ notificationId, userId, path });
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error in notification PATCH route:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 