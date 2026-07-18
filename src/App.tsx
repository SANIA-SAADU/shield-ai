import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppLayout } from "@/layout/AppLayout";
import { Loader } from "@/components/Loader";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";

const DashboardPage = lazy(() => import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const ScamDetectionPage = lazy(() => import("@/pages/ScamDetectionPage").then((m) => ({ default: m.ScamDetectionPage })));
const CurrencyPage = lazy(() => import("@/pages/CurrencyPage").then((m) => ({ default: m.CurrencyPage })));
const FraudNetworkPage = lazy(() => import("@/pages/FraudNetworkPage").then((m) => ({ default: m.FraudNetworkPage })));
const HeatmapPage = lazy(() => import("@/pages/HeatmapPage").then((m) => ({ default: m.HeatmapPage })));
const ChatbotPage = lazy(() => import("@/pages/ChatbotPage").then((m) => ({ default: m.ChatbotPage })));
const EmergencyPage = lazy(() => import("@/pages/EmergencyPage").then((m) => ({ default: m.EmergencyPage })));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <Loader label="Authenticating..." className="min-h-screen" />;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <Loader label="Loading..." className="min-h-screen" />;
  if (session) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Suspense fallback={<Loader label="Loading..." />}><DashboardPage /></Suspense>} />
        <Route path="/scam-detection" element={<Suspense fallback={<Loader label="Loading..." />}><ScamDetectionPage /></Suspense>} />
        <Route path="/currency" element={<Suspense fallback={<Loader label="Loading..." />}><CurrencyPage /></Suspense>} />
        <Route path="/network" element={<Suspense fallback={<Loader label="Loading..." />}><FraudNetworkPage /></Suspense>} />
        <Route path="/heatmap" element={<Suspense fallback={<Loader label="Loading..." />}><HeatmapPage /></Suspense>} />
        <Route path="/chatbot" element={<Suspense fallback={<Loader label="Loading..." />}><ChatbotPage /></Suspense>} />
        <Route path="/emergency" element={<Suspense fallback={<Loader label="Loading..." />}><EmergencyPage /></Suspense>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster richColors position="top-right" theme="dark" />
      </BrowserRouter>
    </AuthProvider>
  );
}
