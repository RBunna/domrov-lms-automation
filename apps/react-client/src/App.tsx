import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicRoute from "@/components/PublicRoute";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import ClassDashboard from "@/pages/ClassDashboard";
import CreateClass from "@/pages/CreateClass";
import EditClass from "@/pages/EditClass";
import CreateAssignmentPage from "@/pages/CreateAssignmentPage";
import EditAssignmentPage from "@/pages/EditAssignmentPage";
import Docs from "@/pages/Docs";
import About from "@/pages/About";
import Pricing from "@/pages/Pricing";
import StudentAssignmentDetail from "@/pages/StudentAssignmentDetail";
import ViewAssignmentPage from "@/pages/ViewAssignmentPage";
import CreditPurchasePage from "./pages/CreditPurchase";
import AIEvaluationPage from "@/pages/AIEvaluationPage";

import UserProfilePage from "@/pages/profile";
import { useParams } from "react-router-dom";

const CreateAssignmentPageWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <CreateAssignmentPage classId={id} />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public pages - accessible to everyone */}
      <Route path="/" element={<Landing />} />
      <Route path="/docs" element={<Docs />} />
      <Route path="/about" element={<About />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Protected pages - require authentication */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/class/create"
        element={
          <ProtectedRoute>
            <CreateClass />
          </ProtectedRoute>
        }
      />
      <Route
        path="/class/:id/edit"
        element={
          <ProtectedRoute>
            <EditClass />
          </ProtectedRoute>
        }
      />
      <Route
        path="/class/:id"
        element={
          <ProtectedRoute>
            <ClassDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/class/:id/assignment/create"
        element={
          <ProtectedRoute>
            <CreateAssignmentPageWrapper />
          </ProtectedRoute>
        }
      />
      <Route
        path="/class/:id/assignment/:assignmentId/edit"
        element={
          <ProtectedRoute>
            <EditAssignmentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/class/:id/assignment/:assignmentId/view"
        element={
          <ProtectedRoute>
            <ViewAssignmentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <UserProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/creditPurchase"
        element={
          <ProtectedRoute>
            <CreditPurchasePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai-evaluation"
        element={
          <ProtectedRoute>
            <AIEvaluationPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
