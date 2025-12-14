import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import  AuthProvider from "./context/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

import StudentLayout from "./pages/dashboard/student/StudentLayout";
import OverviewPage from "./pages/dashboard/student/OverviewPage";
import BrowsePage from "./pages/dashboard/student/BrowsePage";
import SavedJobsPage from "./pages/dashboard/student/SavedJobsPage";
import AdvancedSearchPage from "./pages/dashboard/student/AdvancedSearchPage";
import ApplicationsPage from "./pages/dashboard/student/ApplicationsPage";
import ProfilePage from "./pages/dashboard/student/ProfilePage";
import MessagesPage from "./pages/dashboard/student/MessagesPage";

import InternshipDetailsPage from "./pages/InternshipDetailsPage";

import EmployerLayout from "./pages/dashboard/employer/EmployerLayout.tsx";
import PostInternshipPage from "./pages/dashboard/employer/PostInternshipPage.tsx";
import EmployerDashboard from "./pages/dashboard/employer/EmployerDashboard.tsx";

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
            <Route path="advanced-search" element={<AdvancedSearchPage />} />
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
            {/* DEFAULT Employer page (NOT the post form anymore) */}
            <Route index element={<EmployerDashboard />} />

            {/* Post Internship page */}
            <Route path="post" element={<PostInternshipPage />} />
          </Route>

          {/* Default: send unknown routes to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
