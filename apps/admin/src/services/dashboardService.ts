// Dashboard Service - Handles dashboard statistics and recent activity

import { apiClient } from './api';

export interface DashboardStats {
    totalUsers: number;
    activeUsers: number;
    totalTransactions: number;
    totalRevenue: number;
    monthlyGrowth: number;
}

export interface Activity {
    id: string;
    type: string;
    description: string;
    user: string;
    timestamp: string;
    amount: number | null;
}

export interface RecentActivityResponse {
    activities: Activity[];
}

class DashboardService {
    async fetchStats(): Promise<DashboardStats> {
        try {
            // API returns { success: true, data: { totalUsers, activeUsers, totalTransactions, ... } }
            // request function automatically unwraps to { totalUsers, activeUsers, totalTransactions, ... }
            const response = await apiClient.dashboard.getStats();
            return {
                totalUsers: response.totalUsers || 0,
                activeUsers: response.activeUsers || 0,
                totalTransactions: response.totalTransactions || 0,
                totalRevenue: response.totalRevenue || 0,
                monthlyGrowth: response.monthlyGrowth || 0,
            };
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
            throw error;
        }
    }

    async fetchRecentActivity(): Promise<RecentActivityResponse> {
        try {
            // API returns { success: true, data: { activities: [...] } }
            // request function automatically unwraps to { activities: [...] }
            const response = await apiClient.dashboard.getRecentActivity();
            return {
                activities: response.activities || [],
            };
        } catch (error) {
            console.error('Failed to fetch recent activity:', error);
            throw error;
        }
    }
}

export const dashboardService = new DashboardService();
