
import Header from '../components/dashboard/Header';
import StatsCards from '../components/dashboard/StatsCards';
import UserGrowthChart from '../components/dashboard/UserGrowthChart';
import RecentActivity from '../components/dashboard/RecentActivity';
import { MainLayout } from '../components/layout';

const Dashboard = () => {
    return (
        <MainLayout>
            <Header />
            <StatsCards />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <UserGrowthChart />
                <RecentActivity />
            </div>
        </MainLayout>
    );
};

export default Dashboard;
