import React from 'react';
import Sidebar from '../dashboard/Sidebar';
import { MAX_WIDTH_CONTAINER, MAIN_PADDING } from '../../constants/config';

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div className="flex min-h-screen bg-neutral-50 font-sans">
            <Sidebar />
            <main className={`flex-1 ${MAIN_PADDING}`}>
                <div className={MAX_WIDTH_CONTAINER}>{children}</div>
            </main>
        </div>
    );
};

export default MainLayout;
