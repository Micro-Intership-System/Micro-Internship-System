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
import StudentPortfolioPage from "./pages/dashboard/student/StudentPortfolioPage";
import CourseShopPage from "./pages/dashboard/student/CourseShopPage";
import LeaderboardPage from "./pages/dashboard/student/LeaderboardPage";

import InternshipDetailsPage from "./pages/InternshipDetailsPage";
import EmployerProfile from "./pages/dashboard/employer/EmployerProfile";

import EmployerLayout from "./pages/dashboard/employer/EmployerLayout.tsx";
import PostInternshipPage from "./pages/dashboard/employer/PostInternshipPage.tsx";
import EmployerDashboard from "./pages/dashboard/employer/EmployerDashboard.tsx";
import EmployerJobsPage from "./pages/dashboard/employer/EmployerJobsPage.tsx";
import EditJobPage from "./pages/dashboard/employer/EditJobPage.tsx";
import JobApplicationsPage from "./pages/dashboard/employer/JobApplicationsPage.tsx";
import EmployerStudentPortfolioPage from "./pages/dashboard/employer/EmployerStudentPortfolioPage.tsx";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Root route - redirect to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Student dashboard */}
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
            <Route path="portfolio" element={<StudentPortfolioPage />} />
            <Route path="courses" element={<CourseShopPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
          </Route>

          {/* Internship details */}
          <Route
            path="/internships/:id"
            element={
              <ProtectedRoute>
                <InternshipDetailsPage />
              </ProtectedRoute>
            }
          />

          {/* Employer dashboard */}
          <Route
            path="/dashboard/employer"
            element={
              <ProtectedRoute>
                <EmployerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<EmployerDashboard />} />
            <Route path="jobs" element={<EmployerJobsPage />} />
            <Route path="jobs/:id/edit" element={<EditJobPage />} />
            <Route path="jobs/:id/applications" element={<JobApplicationsPage />} />
            <Route path="profile" element={<EmployerProfile />} />
            <Route path="post" element={<PostInternshipPage />} />

            {/* 👇 Employer views student portfolio (read-only) */}
            <Route
              path="students/:studentId"
              element={<EmployerStudentPortfolioPage />}
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
