import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { SocketProvider } from "./context/SocketContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Tracking from "./pages/Tracking";
import Drivers from "./pages/Drivers";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";
import MaintenanceCosts from "./pages/MaintenanceCosts";
import DriverAnalytics from "./pages/DriverAnalytics";

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
                    <Route path="tracking" element={<Tracking />} />
                    <Route path="drivers" element={<Drivers />} />
                    <Route path="alerts" element={<Alerts />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="maintenance" element={<MaintenanceCosts />} />
                    <Route path="driver-analytics" element={<DriverAnalytics />} />
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
