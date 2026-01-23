import AppLayout from "./Components/AppLayout";
import "./input.css";
import "./input.css";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import "react-toastify/dist/ReactToastify.css";
import ClinicListsForAppointment from "./pages/ClinicListForAppointments";
import DashboardLanding from "./pages/DashboardLanding";
import BookAppointments from "./pages/BookAppointments";
import FollowUps from "./pages/FollowUps";
import UpcomingAppointments from "./pages/UpcomingAppointments";
import PreviousAppointments from "./pages/PreviousAppointments";
import UserInfo from "./pages/UserInfo";
import UserProfileSetting from "./pages/UserProfileSetting";
import MissedAppointments from "./pages/MissedAppointments";
import RecentAppointments from "./pages/RecentAppointments";
import ProtectedRoute from "./Components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
          <Route index element={<DashboardLanding />} />
          <Route
            path="book-appointment-clinics"
            element={<ClinicListsForAppointment />}
          />
          <Route
            path="book-appointment/:clinicId"
            element={<BookAppointments />}
          />
          <Route path="appointment-follow-up" element={<FollowUps />} />
          <Route
            path="upcoming-appointments"
            element={<UpcomingAppointments />}
          />
          <Route
            path="previous-appointments"
            element={<PreviousAppointments />}
          />
          <Route
            path="missed-appointments"
            element={<MissedAppointments />}
          />
          <Route
            path="recent-appointments"
            element={<RecentAppointments />}
          />
          <Route path="user-info/:userId" element={<UserInfo />} />
          <Route
            path="user-profile-settings/:userId"
            element={<UserProfileSetting />}
          />

        </Route>
      </Routes>
    </BrowserRouter>

  );
}

export default App;
