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


const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
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

          {/* default route -> login for now */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
