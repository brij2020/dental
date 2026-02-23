import { createBrowserRouter, Navigate } from "react-router-dom";
import { Suspense, lazy, type ReactNode } from "react";
import ProtectedRoute from "./ProtectedRoute";
import DashboardLayout from "../layouts/DashboardLayout";
import ErrorBoundary from "./ErrorBoundary";
import SpinnerOverlay from "../components/SpinnerOverlay";
import { useAuth } from "../state/useAuth";

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
const ConsultationPreview = lazy(() => import("../pages/consultation/ConsultationPreview"));
const ClinicInformationPanel = lazy(() => import("../pages/settings/components/ClinicInformationPanel"));
const AppointmentTimingsPanel = lazy(() => import("../pages/settings/components/AppointmentTimingsPanel"));
const LeaveSettingsPanel = lazy(() => import("../pages/settings/components/LeavePanel"));


const ProcedurePanel = lazy(() => import("../pages/settings/components/ProcedurePanel"));
const MedicalConditionsPanel = lazy(() => import("../pages/settings/components/MedicalConditionsPanel"));
const RemediesPanel = lazy(() => import("../pages/settings/components/RemediesPanel"));
const ChiefComplaintsPanel = lazy(() => import("../pages/settings/components/ChiefComplaintsPanel"));
const ProcedureProblemsPanel = lazy(() => import("../pages/settings/components/ProcedureProblemsPanel"));
const ProblemsPanel = lazy(() => import("../pages/settings/components/ProblemsPanel"));
const FeesPanel = lazy(() => import("../pages/settings/components/FeesPanel"));
const ClinicPanelsPanel = lazy(() => import("../pages/settings/components/ClinicPanelsPanel"));
const SubscriptionsPanel = lazy(() => import("../pages/settings/components/SubscriptionsPanel"));
const ClinicSubscriptionPanel = lazy(() => import("../pages/settings/components/ClinicSubscriptionPanel"));

const PatientPanel = lazy(() => import("../pages/settings/components/PatientPanel"));
const VideoConsultationTimingsPanel = lazy(() => import("../pages/settings/components/VideoConsultationTimingsPanel"));
const ConsentFormPanel = lazy(() => import("../pages/settings/components/ConsentFormPanel"));


const withSuspense = (el: ReactNode) => (
  <Suspense fallback={<SpinnerOverlay />}>{el}</Suspense>
);

const RequireSuperAdmin = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  if (user.role !== "super_admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const withSuperAdmin = (el: ReactNode) =>
  withSuspense(<RequireSuperAdmin>{el}</RequireSuperAdmin>);

const RequireRoles = ({ roles, children }: { roles: string[]; children: ReactNode }) => {
  const { user } = useAuth();

  if (!user) return null;
  if (!roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const withRoles = (roles: string[], el: ReactNode) =>
  withSuspense(<RequireRoles roles={roles}>{el}</RequireRoles>);

const RequireDoctorSettingsAccess = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();

  if (!user) return null;
  if (user.role === "doctor") {
    return <Navigate to="/settings/profile" replace />;
  }

  return <>{children}</>;
};

const withDoctorSettingsGuard = (el: ReactNode) =>
  withSuspense(<RequireDoctorSettingsAccess>{el}</RequireDoctorSettingsAccess>);

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
          { path: "/clinics",      element: withSuperAdmin(<Clinics />) },
          { path: "/clinics/create", element: withSuperAdmin(<CreateClinic />) },
          { path: "/clinics/:id/edit", element: withSuperAdmin(<EditClinic />) },
          { path: "/patients",     element: withRoles(["admin", "receptionist"], <Patients />) },
          { path: "/appointments", element: withSuspense(<Appointments />) },
          { path: "/insight-videos",      element: withSuspense(<InsightVideos />) },
          {
            path: "/settings",
            element: withSuspense(<Settings />),
            children: [
              { index: true, element: withSuspense(<SettingsMenu />) },
              { path: "users", element: withSuspense(<UserManagementPanel />) },
              { path: "profile", element: withSuspense(<ProfilePanel />) },
              { path: "clinic", element: withDoctorSettingsGuard(<ClinicInformationPanel />) }, 
              { path: "timings", element: withDoctorSettingsGuard(<AppointmentTimingsPanel />) },
              { path: "leaves", element: withRoles(["admin", "doctor"], <LeaveSettingsPanel />) },
              { path: "procedures", element: withDoctorSettingsGuard(<ProcedurePanel />) },
              { path: "conditions", element: withDoctorSettingsGuard(<MedicalConditionsPanel />) },
              { path: "chief-complaint", element: withDoctorSettingsGuard(<ChiefComplaintsPanel />) },
              { path: "remedies", element: withDoctorSettingsGuard(<RemediesPanel />) },
              { path: "problems", element: withDoctorSettingsGuard(<ProblemsPanel />) },
              { path: "procedure-problems", element: withDoctorSettingsGuard(<ProcedureProblemsPanel />) },
              { path: "fees", element: withDoctorSettingsGuard(<FeesPanel />) },
              { path: "clinic-panels", element: withDoctorSettingsGuard(<ClinicPanelsPanel />) },
              { path: "patients", element: withDoctorSettingsGuard(<PatientPanel />) },
              { path: "subscriptions", element: withDoctorSettingsGuard(<SubscriptionsPanel />) },
              { path: "subscription-plan", element: withDoctorSettingsGuard(<ClinicSubscriptionPanel />) },

              { path: "video-consultation-timings", element: withDoctorSettingsGuard(<VideoConsultationTimingsPanel />) },
              { path: "consent", element: withDoctorSettingsGuard(<ConsentFormPanel />) },

            ]
          },
        ],
      },
      {
        path: "/consultation/:appointmentId",
        element: withSuspense(<Consultation />)
      },
      {
        path: "/consultation/:appointmentId/preview",
        element: withSuspense(<ConsultationPreview />)
      }
    ],
  },
  { path: "*", element: <Navigate to="/" replace />, errorElement: <ErrorBoundary /> },
]);

export default router;
