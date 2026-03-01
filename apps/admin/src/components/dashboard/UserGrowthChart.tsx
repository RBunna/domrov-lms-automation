
import { BaseCard } from '../base';

const UserGrowthChart = () => {
    const data = [300, 200, 250, 150, 1000, 350, 400];
    const maxValue = Math.max(...data);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <BaseCard padding="md" className="col-span-1 md:col-span-2">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Income Every Day</h2>
            <p className="text-gray-500 text-xs mb-6">Daily income - Last 7 days</p>
            <div className="h-48 flex items-end gap-2">
                {data.map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                        <span className="text-xs font-semibold text-gray-900 mb-1">${val}</span>
                        <div
                            className="w-full bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-colors"
                            style={{ height: `${(val / maxValue) * 160}px` }}
                            title={`$${val}`}
                        />
                        <span className="text-xs text-gray-500 mt-2 font-medium">{days[i]}</span>
                    </div>
                ))}
            </div>
        </BaseCard>
    );
};

export default UserGrowthChart;
