import { useEffect, useState } from 'react';
import { Users, Package, CreditCard, AlertCircle } from 'lucide-react';
import { BaseCard } from '../base';
import { dashboardService, type DashboardStatsDto } from '../../services';

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

const formatCurrency = (num: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(num);
};

const StatsCards = () => {
  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
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
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load statistics'
        );
        console.error('Failed to fetch dashboard stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {Array(4)
          .fill(0)
          .map((_, i) => (
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
        <BaseCard padding="md" className="col-span-full bg-red-50 border border-red-200">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="font-medium">{error || 'Failed to load statistics'}</p>
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
      change: `${stats.monthlyGrowth > 0 ? '+' : ''}${stats.monthlyGrowth.toFixed(1)}% growth`,
    },
    {
      label: 'Active Users',
      value: formatNumber(stats.activeUsers),
      icon: Users,
      iconColor: 'text-green-600',
      change: `${((stats.activeUsers / Math.max(1, stats.totalUsers)) * 100).toFixed(1)}% of total`,
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: CreditCard,
      iconColor: 'text-emerald-600',
      change: `${stats.totalTransactions} transactions`,
    },
    {
      label: 'Transactions',
      value: formatNumber(stats.totalTransactions),
      icon: Package,
      iconColor: 'text-purple-600',
      change: `Completed`,
    },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
      {statsList.map((stat) => {
        const Icon = stat.icon;
        return (
          <BaseCard key={stat.label} padding="md" className="hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500">{stat.change}</p>
              </div>
              <Icon className={`h-8 w-8 ${stat.iconColor} opacity-20`} />
            </div>
          </BaseCard>
        );
      })}
    </section>
  );
};

export default StatsCards;