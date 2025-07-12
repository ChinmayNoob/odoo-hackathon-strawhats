'use client';

import { useEffect, useState } from 'react';
import { IoNotificationsOutline } from 'react-icons/io5';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import NotificationList from './notification-list';
import { getUnreadCount } from '@/lib/axios/notifications';

interface NotificationBellProps {
    userId: number;
}

const NotificationBell = ({ userId }: NotificationBellProps) => {
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = async () => {
        try {
            const count = await getUnreadCount(userId);
            setUnreadCount(count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    useEffect(() => {
        fetchUnreadCount();
        // Poll for new notifications every minute
        const interval = setInterval(fetchUnreadCount, 60000);
        return () => clearInterval(interval);
    }, [userId]);

    return (
        <Sheet>
            <SheetTrigger asChild>
                <button className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                    <IoNotificationsOutline className="size-6" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 inline-flex items-center justify-center size-5 text-xs font-bold text-white bg-red-500 rounded-full">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>Notifications</SheetTitle>
                </SheetHeader>
                <div className="mt-4">
                    <NotificationList userId={userId} />
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default NotificationBell; 