import { createBrowserRouter, Navigate } from "react-router-dom";
import { Suspense, lazy, type ReactNode } from "react";
import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "../layouts/DashboardLayout";
import ErrorBoundary from "./ErrorBoundary";
import SpinnerOverlay from "../components/SpinnerOverlay";

const Login         = lazy(() => import("../pages/auth/Login"));
const ForgotPassword = lazy(() => import("../pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/auth/ResetPassword"));
const Dashboard     = lazy(() => import("../pages/dashboard/Dashboard"));
const Patients      = lazy(() => import("../pages/patients/Patients"));
const Appointments  = lazy(() => import("../pages/appointments/Appointments"));
const InsightVideos  = lazy(() => import("../pages/insightVideos/InsightVideos"));
const Settings      = lazy(() => import("../pages/settings/Settings"));
const Clinics       = lazy(() => import("../pages/clinics/Clinics"));
const CreateClinic  = lazy(() => import("../pages/clinics/CreateClinic"));
const EditClinic    = lazy(() => import("../pages/clinics/EditClinic"));
const UserManagementPanel = lazy(() => import("../pages/settings/components/UserManagementPanel"));
const ProfilePanel        = lazy(() => import("../pages/settings/components/ProfilePanel"));
const SettingsMenu = lazy(() => import("../pages/settings/components/SettingsMenu"));
const Consultation = lazy(() => import("../pages/consultation/Consultation"));
const ClinicInformationPanel = lazy(() => import("../pages/settings/components/ClinicInformationPanel"));
const AppointmentTimingsPanel = lazy(() => import("../pages/settings/components/AppointmentTimingsPanel"));
const LeaveSettingsPanel = lazy(() => import("../pages/settings/components/LeavePanel"));


const ProcedurePanel = lazy(() => import("../pages/settings/components/ProcedurePanel"));
const MedicalConditionsPanel = lazy(() => import("../pages/settings/components/MedicalConditionsPanel"));
const RemediesPanel = lazy(() => import("../pages/settings/components/RemediesPanel"));
const ProcedureProblemsPanel = lazy(() => import("../pages/settings/components/ProcedureProblemsPanel"));
const ProblemsPanel = lazy(() => import("../pages/settings/components/ProblemsPanel"));
const FeesPanel = lazy(() => import("../pages/settings/components/FeesPanel"));
const ClinicPanelsPanel = lazy(() => import("../pages/settings/components/ClinicPanelsPanel"));

const PatientPanel = lazy(() => import("../pages/settings/components/PatientPanel"));
const VideoConsultationTimingsPanel = lazy(() => import("../pages/settings/components/VideoConsultationTimingsPanel"));
const ConsentFormPanel = lazy(() => import("../pages/settings/components/ConsentFormPanel"));


const withSuspense = (el: ReactNode) => (
  <Suspense fallback={<SpinnerOverlay />}>{el}</Suspense>
);

const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/dashboard" replace />, errorElement: <ErrorBoundary /> },
  { path: "/login", element: withSuspense(<Login />), errorElement: <ErrorBoundary /> },
  { path: "/forgot-password", element: withSuspense(<ForgotPassword />), errorElement: <ErrorBoundary /> },
  { path: "/reset-password", element: withSuspense(<ResetPassword />), errorElement: <ErrorBoundary /> },
  {
    element: <ProtectedRoute />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        element: <DashboardLayout />,
        errorElement: <ErrorBoundary />,
        children: [
          { path: "/dashboard",    element: withSuspense(<Dashboard />) },
          { path: "/clinics",      element: withSuspense(<Clinics />) },
          { path: "/clinics/create", element: withSuspense(<CreateClinic />) },
          { path: "/clinics/:id/edit", element: withSuspense(<EditClinic />) },
          { path: "/patients",     element: withSuspense(<Patients />) },
          { path: "/appointments", element: withSuspense(<Appointments />) },
          { path: "/insight-videos",      element: withSuspense(<InsightVideos />) },
          {
            path: "/settings",
            element: withSuspense(<Settings />),
            children: [
              { index: true, element: withSuspense(<SettingsMenu />) },
              { path: "users", element: withSuspense(<UserManagementPanel />) },
              { path: "profile", element: withSuspense(<ProfilePanel />) },
              { path: "clinic", element: withSuspense(<ClinicInformationPanel />) }, 
              { path: "timings", element: withSuspense(<AppointmentTimingsPanel />) },
              { path: "leaves", element: withSuspense(<LeaveSettingsPanel />) },
              { path: "procedures", element: withSuspense(<ProcedurePanel />) },
              { path: "conditions", element: withSuspense(<MedicalConditionsPanel />) },
              { path: "remedies", element: withSuspense(<RemediesPanel />) },
              { path: "problems", element: withSuspense(<ProblemsPanel />) },
              { path: "procedure-problems", element: withSuspense(<ProcedureProblemsPanel />) },
              { path: "fees", element: withSuspense(<FeesPanel />) },
              { path: "clinic-panels", element: withSuspense(<ClinicPanelsPanel />) },
              { path: "patients", element: withSuspense(<PatientPanel />) },

              { path: "video-consultation-timings", element: withSuspense(<VideoConsultationTimingsPanel />) },
              { path: "consent", element: withSuspense(<ConsentFormPanel />) },

            ]
          },
        ],
      },
      {
        path: "/consultation/:appointmentId",
        element: withSuspense(<Consultation />)
      }
    ],
  },
  { path: "*", element: <Navigate to="/" replace />, errorElement: <ErrorBoundary /> },
]);

export default router;
