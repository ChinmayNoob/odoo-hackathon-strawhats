import axios from "axios";

interface GetNotificationsParams {
    userId: number;
    page?: number;
    pageSize?: number;
}

interface MarkNotificationReadParams {
    notificationId: number;
    userId: number;
    path: string;
}

export async function getNotifications({ userId, page = 1, pageSize = 20 }: GetNotificationsParams) {
    try {
        const response = await axios.get(`/api/notifications`, {
            params: { userId, page, pageSize }
        });
        return { success: true, ...response.data };
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return { success: false, error: "Failed to fetch notifications" };
    }
}

export async function markNotificationRead({ notificationId, userId, path }: MarkNotificationReadParams) {
    try {
        const response = await axios.patch(`/api/notifications/${notificationId}`, {
            userId,
            path
        });
        return { success: true, ...response.data };
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return { success: false, error: "Failed to mark notification as read" };
    }
}

export async function getUnreadCount(userId: number) {
    try {
        const response = await axios.get(`/api/notifications/unread-count`, {
            params: { userId }
        });
        return response.data.count;
    } catch (error) {
        console.error("Error fetching unread count:", error);
        return 0;
    }
} 