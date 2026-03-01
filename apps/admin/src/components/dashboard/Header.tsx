

import { Bell } from 'lucide-react';

const Header = () => (
    <header className="flex items-center justify-between mb-10">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-4">
            <button
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors text-gray-600"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
            </button>
            <img
                src="https://randomuser.me/api/portraits/women/44.jpg"
                alt="User avatar"
                className="w-10 h-10 rounded-full border border-neutral-200 object-cover"
            />
        </div>
    </header>
);

export default Header;
