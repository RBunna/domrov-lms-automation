"use client";


import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types/enums";
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
import TeacherAssignmentTab from "@/features/classDashboard/tabs/TeacherAssignmentTab";
import { useParams, useLocation } from "react-router-dom";
import classService from "@/services/classService";

type TabId = "general" | "assignment" | "posts" | "students" | "files" | "grades";


export default function ClassDashboardClient() {
  const params = useParams();
  const classId = params.id as string;
  const { isLoading: authLoading } = useAuth();
  const location = useLocation();
  const initialTab = (location.state?.activeTab as TabId) || "general";
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  // Use role from location.state if available (passed from ClassCard), otherwise null
  const [role, setRole] = useState<string | null>(location.state?.role || null);
  const [isLoadingRole, setIsLoadingRole] = useState(!location.state?.role);
  const [error] = useState<string | null>(null);

  // Fetch the class role from API to verify and keep up-to-date
  useEffect(() => {
    // If we already have role from location.state, don't need to fetch
    if (location.state?.role) {
      setIsLoadingRole(false);
      return;
    }

    const fetchClassRole = async () => {
      try {
        const classData = await classService.getClass(parseInt(classId));
        setRole(classData.role || "Student"); // Default to Student, not Teacher
      } catch (err) {
        console.error("Failed to fetch class role:", err);
        // Default to Student role on error (prevents showing error message)
        setRole("Student");
      } finally {
        setIsLoadingRole(false);
      }
    };

    if (classId) {
      fetchClassRole();
    }
  }, [classId, location.state?.role]);

  const renderTabContent = () => {
    // Normalize role to match UserRole enum (API returns "Teacher" or "Student")
    const normalizedRole = role === "Teacher" || role === UserRole.Teacher ? UserRole.Teacher : UserRole.Student;
    
    if (normalizedRole === UserRole.Teacher) {
      switch (activeTab) {
        case "general":
          return <GeneralTab classId={classId} />;
        case "assignment":
          return <TeacherAssignmentTab classId={classId} />;
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
    } else if (normalizedRole === UserRole.Student) {
      switch (activeTab) {
        case "general":
          return <GeneralTab classId={classId} />;
        case "assignment":
          return <AssignmentTab classId={classId} />;
        case "posts":
          return <PostsTab classId={classId} />;
        case "files":
          return <FilesTab classId={classId} />;
        case "grades":
          return <GradesTab classId={classId} />;
        // Students tab is not available for students
        default:
          return <GeneralTab classId={classId} />;
      }
    }
    return null;
  };

  if (authLoading || isLoadingRole) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-slate-600">Loading class dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  // Permission: Only show dashboard if user is enrolled (role is present)
  if (!role) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-600">Unable to load class. Please try again.</div>
      </div>
    );
  }

  // Normalize role for tab access control
  const normalizedRole = role === "Teacher" || role === UserRole.Teacher ? UserRole.Teacher : UserRole.Student;
  
  // Teacher: all tabs, Student: no Students tab
  const allowedTabs: TabId[] = normalizedRole === UserRole.Teacher
    ? ["general", "assignment", "posts", "students", "files", "grades"]
    : ["general", "assignment", "posts", "files", "grades"];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <MainNavigation activeId="classes" />
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex w-full min-h-screen">
          {/* Class Sidebar (middle left) */}
          <ClassSidebar
            classId={classId}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            allowedTabs={allowedTabs}
            role={role}
          />

          {/* Main Content Area */}
          <div className="flex flex-col flex-1 min-w-0">
            {/* Top Header Navigation */}
            <ClassTabs activeTab={activeTab} allowedTabs={allowedTabs} />

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
