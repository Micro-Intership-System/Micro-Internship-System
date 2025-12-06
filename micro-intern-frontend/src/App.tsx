import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

import StudentLayout from "./pages/dashboard/student/StudentLayout";
import OverviewPage from "./pages/dashboard/student/OverviewPage";
import BrowsePage from "./pages/dashboard/student/BrowsePage";
import SavedJobsPage from "./pages/dashboard/student/SavedJobsPage";
import ApplicationsPage from "./pages/dashboard/student/ApplicationsPage";
import ProfilePage from "./pages/dashboard/student/ProfilePage";
import MessagesPage from "./pages/dashboard/student/MessagesPage";

import InternshipDetailsPage from "./pages/InternshipDetailsPage";

import EmployerLayout from "./pages/dashboard/employer/EmployerLayout";
import PostInternshipPage from "./pages/dashboard/employer/PostInternshipPage";
import EmployerDashboard from "./pages/dashboard/employer/EmployerDashboard";
import EmployerProfile from "./pages/dashboard/employer/EmployerProfile";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Student dashboard (nested routes) */}
          <Route
            path="/dashboard/student"
            element={
              <ProtectedRoute>
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OverviewPage />} />
            <Route path="browse" element={<BrowsePage />} />
            <Route path="saved" element={<SavedJobsPage />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="messages" element={<MessagesPage />} />
          </Route>

          {/* Internship details page */}
          <Route
            path="/internships/:id"
            element={
              <ProtectedRoute>
                <InternshipDetailsPage />
              </ProtectedRoute>
            }
          />

          {/* Employer dashboard (nested routes) */}
          <Route
            path="/dashboard/employer"
            element={
              <ProtectedRoute>
                <EmployerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<EmployerDashboard />} />
            <Route path="post" element={<PostInternshipPage />} />
            <Route path="profile" element={<EmployerProfile />} />
          </Route>

          {/* Default: send unknown routes to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
