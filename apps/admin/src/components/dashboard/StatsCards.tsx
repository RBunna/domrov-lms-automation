import { useEffect, useState } from 'react';
import { Users, Package, CreditCard } from 'lucide-react';
import { BaseCard } from '../base';
import { dashboardService, type DashboardStats } from '../../services';

interface Stat {
    label: string;
    value: string;
    icon: React.ComponentType<{ className: string }>;
    iconColor: string;
    change: string;
}

const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US', {
        maximumFractionDigits: 0,
    });
};

const StatsCards = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await dashboardService.fetchStats();
                setStats(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load statistics');
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {Array(4).fill(0).map((_, i) => (
                    <BaseCard key={i} padding="md">
                        <div className="h-24 bg-gray-200 rounded animate-pulse" />
                    </BaseCard>
                ))}
            </section>
        );
    }

    if (error || !stats) {
        return (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                <BaseCard padding="md" className="col-span-full">
                    <div className="text-center py-8">
                        <p className="text-red-600 font-medium">{error || 'Failed to load statistics'}</p>
                    </div>
                </BaseCard>
            </section>
        );
    }

    const statsList: Stat[] = [
        {
            label: 'Total Users',
            value: formatNumber(stats.totalUsers),
            icon: Users,
            iconColor: 'text-blue-600',
            change: `${stats.monthlyGrowth > 0 ? '+' : ''}${stats.monthlyGrowth.toFixed(1)}%`,
        },
        {
            label: 'Active Users',
            value: formatNumber(stats.activeUsers),
            icon: Users,
            iconColor: 'text-amber-600',
            change: `${((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}%`,
        },
        {
            label: 'Total Revenue',
            value: `$${formatNumber(Math.round(stats.totalRevenue))}`,
            icon: CreditCard,
            iconColor: 'text-green-600',
            change: `${stats.totalTransactions} transactions`,
        },
        {
            label: 'Transactions',
            value: formatNumber(stats.totalTransactions),
            icon: Package,
            iconColor: 'text-purple-600',
            change: '+recent',
        },
    ];

    return (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {statsList.map((stat) => {
                const Icon = stat.icon;
                return (
                    <BaseCard key={stat.label} padding="md">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-gray-600">{stat.label}</h3>
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                            </div>
                        </div>
                        <div className="mb-3">
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                        <div className="text-xs text-green-600 font-semibold">
                            {stat.change}
                        </div>
                    </BaseCard>
                );
            })}
        </section>
    );
};

export default StatsCards;