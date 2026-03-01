import { useEffect, useState } from 'react';
import { ShoppingBag, UserPlus, AlertCircle } from 'lucide-react';
import { BaseCard } from '../base';
import { dashboardService, type Activity } from '../../services';

const getActivityIcon = (type: string) => {
    switch (type) {
        case 'purchase':
            return ShoppingBag;
        case 'user_registration':
            return UserPlus;
        default:
            return AlertCircle;
    }
};

const getActivityColor = (type: string): string => {
    switch (type) {
        case 'purchase':
            return 'text-green-600';
        case 'user_registration':
            return 'text-blue-600';
        default:
            return 'text-gray-600';
    }
};

const formatTimeAgo = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
};

const RecentActivity = () => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await dashboardService.fetchRecentActivity();
                setActivities(data.activities || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load activities');
            } finally {
                setIsLoading(false);
            }
        };

        fetchActivity();
    }, []);

    if (isLoading) {
        return (
            <BaseCard padding="md" className="col-span-1">
                <h2 className="text-base font-semibold text-gray-900 mb-1">Recent Activity</h2>
                <p className="text-gray-500 text-xs mb-6">Latest system events</p>
                <div className="space-y-4">
                    {Array(4).fill(0).map((_, i) => (
                        <div key={i} className="h-6 bg-gray-200 rounded animate-pulse" />
                    ))}
                </div>
            </BaseCard>
        );
    }

    if (error) {
        return (
            <BaseCard padding="md" className="col-span-1">
                <h2 className="text-base font-semibold text-gray-900 mb-1">Recent Activity</h2>
                <p className="text-red-600 text-sm mt-4">{error}</p>
            </BaseCard>
        );
    }

    const displayActivities = activities.slice(0, 5);

    return (
        <BaseCard padding="md" className="col-span-1">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Recent Activity</h2>
            <p className="text-gray-500 text-xs mb-6">Latest system events</p>
            {displayActivities.length === 0 ? (
                <p className="text-gray-500 text-sm">No recent activity</p>
            ) : (
                <ul className="space-y-4">
                    {displayActivities.map((activity) => {
                        const Icon = getActivityIcon(activity.type);
                        const icoColor = getActivityColor(activity.type);
                        return (
                            <li key={activity.id} className="flex items-center justify-between">
                                <span className="flex items-center gap-3 flex-1 min-w-0">
                                    <Icon className={`w-4 h-4 flex-shrink-0 ${icoColor}`} />
                                    <div className="text-sm text-gray-700 font-medium truncate">
                                        {activity.user}
                                        {activity.amount && <span className="text-gray-500"> - ${activity.amount}</span>}
                                    </div>
                                </span>
                                <span className="text-gray-500 text-xs font-medium flex-shrink-0 ml-2">
                                    {formatTimeAgo(activity.timestamp)}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </BaseCard>
    );
};

export default RecentActivity;