import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { SocketProvider } from "./context/SocketContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import Loader from "./components/Loader";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// Route-level code splitting: these pages pull in heavy libraries
// (react-leaflet, jspdf/jspdf-autotable, recharts) that were previously
// bundled into the single main chunk and downloaded on every reload even
// if the user only ever visits the Dashboard. Lazy-loading them means each
// only downloads when its route is actually visited, which is what made
// reloads and first navigation to these pages feel slow.
const Tracking = lazy(() => import("./pages/Tracking"));
const Drivers = lazy(() => import("./pages/Drivers"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Reports = lazy(() => import("./pages/Reports"));
const MaintenanceCosts = lazy(() => import("./pages/MaintenanceCosts"));
const DriverAnalytics = lazy(() => import("./pages/DriverAnalytics"));

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <BrowserRouter>
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Dashboard />} />
                    <Route
                      path="tracking"
                      element={
                        <Suspense fallback={<Loader label="Loading live tracking..." />}>
                          <Tracking />
                        </Suspense>
                      }
                    />
                    <Route
                      path="drivers"
                      element={
                        <Suspense fallback={<Loader label="Loading drivers..." />}>
                          <Drivers />
                        </Suspense>
                      }
                    />
                    <Route
                      path="alerts"
                      element={
                        <Suspense fallback={<Loader label="Loading alerts..." />}>
                          <Alerts />
                        </Suspense>
                      }
                    />
                    <Route
                      path="reports"
                      element={
                        <Suspense fallback={<Loader label="Loading reports..." />}>
                          <Reports />
                        </Suspense>
                      }
                    />
                    <Route
                      path="maintenance"
                      element={
                        <Suspense fallback={<Loader label="Loading cost tracker..." />}>
                          <MaintenanceCosts />
                        </Suspense>
                      }
                    />
                    <Route
                      path="driver-analytics"
                      element={
                        <Suspense fallback={<Loader label="Loading driver analytics..." />}>
                          <DriverAnalytics />
                        </Suspense>
                      }
                    />
                  </Route>
                </Routes>
              </AnimatePresence>
            </BrowserRouter>
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
