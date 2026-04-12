import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Suspense, lazy } from "react";

const Index = lazy(() => import("@/pages/Index"));
const CreateSpacePage = lazy(() => import("@/pages/CreateSpacePage"));
const BoardPage = lazy(() => import("@/pages/BoardPage"));
const ListPage = lazy(() => import("@/pages/ListPage"));
const BacklogPage = lazy(() => import("@/pages/BacklogPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const TimelinePage = lazy(() => import("@/pages/TimelinePage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const ManageSpacesPage = lazy(() => import("@/pages/ManageSpacesPage"));
const SpaceSettingsLayout = lazy(() => import("@/pages/SpaceSettingsLayout"));
const SpaceDetailsPage = lazy(() => import("@/pages/SpaceDetailsPage"));
const SpaceAccessPage = lazy(() => import("@/pages/SpaceAccessPage"));
const AccountSettingsLayout = lazy(() => import("@/pages/settings/AccountSettingsLayout"));
const ProfileSettingsPage = lazy(() => import("@/pages/settings/ProfileSettingsPage"));
const SecuritySettingsPage = lazy(() => import("@/pages/settings/SecuritySettingsPage"));
const AccountNotificationsPage = lazy(() => import("@/pages/settings/AccountNotificationsPage"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-lg">Loading...</div>
                </div>
              }
            >
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Protected routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/create-space"
                  element={
                    <ProtectedRoute>
                      <CreateSpacePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/spaces/:spaceKey/board"
                  element={
                    <ProtectedRoute>
                      <BoardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/spaces/:spaceKey/list"
                  element={
                    <ProtectedRoute>
                      <ListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/spaces/:spaceKey/backlog"
                  element={
                    <ProtectedRoute>
                      <BacklogPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/spaces/:spaceKey/reports"
                  element={
                    <ProtectedRoute>
                      <ReportsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/spaces/:spaceKey/timeline"
                  element={
                    <ProtectedRoute>
                      <TimelinePage />
                    </ProtectedRoute>
                  }
                />

                {/* Manage Spaces */}
                <Route
                  path="/settings/spaces"
                  element={
                    <ProtectedRoute>
                      <ManageSpacesPage />
                    </ProtectedRoute>
                  }
                />

                {/* Space settings */}
                <Route
                  path="/spaces/:spaceKey/settings"
                  element={
                    <ProtectedRoute>
                      <SpaceSettingsLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="details" replace />} />
                  <Route path="details" element={<SpaceDetailsPage />} />
                  <Route path="access" element={<SpaceAccessPage />} />
                </Route>

                {/* Account settings */}
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <AccountSettingsLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="profile" replace />} />
                  <Route path="profile" element={<ProfileSettingsPage />} />
                  <Route path="security" element={<SecuritySettingsPage />} />
                  <Route path="notifications" element={<AccountNotificationsPage />} />
                </Route>

                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
