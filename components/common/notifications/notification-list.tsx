'use client';

import { useEffect, useState } from 'react';
import { getNotifications, markNotificationRead } from '@/lib/axios/notifications';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

interface Notification {
    id: number;
    type: 'answer' | 'forum_question';
    title: string;
    content: string;
    questionId?: number;
    answerId?: number;
    forumId?: number;
    isRead: boolean;
    createdAt: Date;
}

interface NotificationListProps {
    userId: number;
}

const NotificationList = ({ userId }: NotificationListProps) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const fetchNotifications = async (pageNum: number, isInitialFetch: boolean = false) => {
        try {
            setIsLoading(true);
            const response = await getNotifications({ userId, page: pageNum });
            if (response.success) {
                setNotifications(prev =>
                    isInitialFetch || pageNum === 1
                        ? response.notifications
                        : [...prev, ...response.notifications]
                );
                setHasMore(response.isNext);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications(1, true);
    }, [userId]);

    useEffect(() => {
        if (page > 1) {
            fetchNotifications(page, false);
        }
    }, [page]);

    const handleMarkAsRead = async (notificationId: number) => {
        try {
            const response = await markNotificationRead({
                notificationId,
                userId,
                path: window.location.pathname
            });

            if (response.success) {
                // Refresh notifications after marking as read
                await fetchNotifications(1, true);
                setPage(1); // Reset to first page
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const getNotificationLink = (notification: Notification) => {
        if (notification.questionId) {
            return `/question/${notification.questionId}`;
        }
        if (notification.forumId) {
            return `/forums/${notification.forumId}`;
        }
        return '#';
    };

    const uniqueNotifications = notifications.filter((notification, index, self) =>
        index === self.findIndex((n) => n.id === notification.id)
    );

    return (
        <div className="flex flex-col gap-4 w-full max-w-md p-4">
            {uniqueNotifications.map((notification) => (
                <div
                    key={`notification-${notification.id}`}
                    className={`rounded-lg border ${notification.isRead ? 'bg-gray-50/50 dark:bg-gray-800/50' : 'bg-blue-50/50 dark:bg-blue-900/50'} hover:shadow-md transition-all duration-200`}
                >
                    <div className="p-4">
                        <Link
                            href={getNotificationLink(notification)}
                            className="block"
                        >
                            <h3 className="font-semibold text-base mb-2">{notification.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{notification.content}</p>
                        </Link>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t">
                            <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                            </span>
                            {!notification.isRead && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    className="ml-2 hover:bg-blue-100 dark:hover:bg-blue-800"
                                >
                                    Mark as read
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            {hasMore && (
                <Button
                    variant="outline"
                    onClick={() => setPage(prev => prev + 1)}
                    disabled={isLoading}
                    className="mt-2 w-full"
                >
                    {isLoading ? 'Loading...' : 'Load More'}
                </Button>
            )}
            {!hasMore && notifications.length > 0 && (
                <p className="text-center text-gray-500 mt-4">No more notifications</p>
            )}
            {notifications.length === 0 && !isLoading && (
                <p className="text-center text-gray-500">No notifications yet</p>
            )}
        </div>
    );
};

export default NotificationList; 