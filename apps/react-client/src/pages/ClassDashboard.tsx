"use client";

import { useState } from "react";
import MainNavigation from "@/components/navigation/Navigation";
import {
  ClassSidebar,
  ClassTabs,
  GeneralTab,
  AssignmentTab,
  PostsTab,
  StudentsTab,
  FilesTab,
  GradesTab,
} from "@/features/classDashboard";
import { useParams } from "react-router-dom";

type TabId = "general" | "assignment" | "posts" | "students" | "files" | "grades";

export default function ClassDashboardClient() {
  const params = useParams();
  const classId = params.id as string;
  const [activeTab, setActiveTab] = useState<TabId>("general");

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return <GeneralTab classId={classId} />;
      case "assignment":
        return <AssignmentTab classId={classId} />;
      case "posts":
        return <PostsTab classId={classId} />;
      case "students":
        return <StudentsTab classId={classId} />;
      case "files":
        return <FilesTab classId={classId} />;
      case "grades":
        return <GradesTab classId={classId} />;
      default:
        return <GeneralTab classId={classId} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <MainNavigation activeId="classes" />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex w-full min-h-screen">
          {/* Class Sidebar (middle left) */}
          <ClassSidebar classId={classId} activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Tabs Navigation */}
            <ClassTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Tab Content */}
            <main className="flex-1 overflow-y-auto bg-slate-50">
              <div key={activeTab} className="animate-fadeIn">
                {renderTabContent()}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
