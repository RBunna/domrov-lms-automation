
import { Routes, Route } from 'react-router-dom';
import Landing from '@/pages/Landing';
import Dashboard from '@/pages/Dashboard';
import Login from '@/pages/Login';
import ClassDashboard from '@/pages/ClassDashboard';
import Docs from '@/pages/Docs';
import About from '@/pages/About';
import Pricing from '@/pages/Pricing';
import AssignmentDetail from '@/pages/AssignmentDetail';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/class/:id" element={<ClassDashboard />} />
      <Route path="/docs" element={<Docs />} />
      <Route path="/about" element={<About />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/assignment/:id" element={<AssignmentDetail />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AppRoutes />
  );
};

export default App;