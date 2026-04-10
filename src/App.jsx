import { Route, Routes, Navigate, useLocation } from "react-router-dom"
import { Toaster } from "sonner"
import Home from "./pages/Home"
import About from "./pages/About"
import Events from "./pages/Events"
import UploadEventByLink from "./pages/UploadEventByLink"
import EventDashboardLayout from "./components/EventDashboard/EventDashboardLayout"
import UploadNewEvent from "./pages/eventDashboard/UploadNewEvent"
import GenerateLink from "./pages/eventDashboard/GenerateLink"
import DepartmentsAllowed from "./pages/eventDashboard/DepartmentsAllowed"
import ForceDeletePermissions from "./pages/eventDashboard/ForceDeletePermissions"
import ManageEvents from "./pages/eventDashboard/ManageEvents"
import UpcomingEventPage from "./pages/eventDashboard/UpcomingEventPage"
import Navbar from "./components/common/Navbar"
import { FeatureFlagsProvider } from "./context/FeatureFlags.jsx"
import { AuthProvider } from "./context/AuthContext"
import NotFound from "./components/NotFound"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import AdminSignupConfig from "./pages/AdminSignupConfig"
import Profile from "./pages/Profile"
import Contact from "./pages/Contact"
import Gallery from "./pages/Gallery"
import Team2 from "./pages/Team2"
import GFGBentoGrid from "./components/GFGBentoGrid";
import Timer from "./pages/Timer"
import ResultPage from "./pages/ResultPage"
import Quiz from "./pages/Quiz"
import Leaderboard from "./pages/Leaderboard"
import QuizResult from "./pages/QuizResult"
import ManageTeam from "./pages/ManageTeam"
import ManageSociety from "./pages/ManageSociety"
import UniversityAdminDashboard from "./pages/UniversityAdminDashboard"
import UniversityLevelAdminDashboard from "./pages/UniversityLevelAdminDashboard"
import FacultyDashboard from "./pages/FacultyDashboard"
import JoinTeamByLink from "./pages/JoinTeamByLink"
import AuthAwareLayout from "./components/AuthAwareLayout"
import Register from "./pages/Register"
import InterviewSetup from "./pages/InterviewSetup"
import InterviewDashboard from "./pages/InterviewDashboard"
import MyInterview from "./pages/MyInterview"
import { AnimatePresence, motion } from "framer-motion"
import { useAuth } from "./context/AuthContext"
import { isSocietyRole } from "./services/api"

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return null
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}

function RequireRole({ roles, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return null
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (roles && !roles.includes(user.accountType)) {
    return <Navigate to="/" replace />
  }
  return children
}

function RequireSocietyScoped({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return null
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  const ok = isSocietyRole(user.accountType) || Boolean(user.society) || Boolean(user.facultyContext)
  if (!ok) return <Navigate to="/manage-team" replace />
  return children
}

function App() {
  const location = useLocation()
  const dropdownBasePaths = [
    "/dashboard",
    "/profile",
    "/manage-team",
    "/manage-society",
  ]

  const shouldAnimatePage = dropdownBasePaths.some((base) =>
    location.pathname === base || location.pathname.startsWith(base + "/"),
  )

  return (
    <FeatureFlagsProvider>
      <AuthProvider>
      <div className="min-h-screen flex flex-col overflow-x-hidden">
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: { background: "linear-gradient(to bottom right, #1e1e2f, #2c2c3e)", border: "1px solid rgba(255,255,255,0.1)", color: "#e5e5e5" },
            className: "sonner-toast-darkthemebg",
          }}
          closeButton
        />
        <Navbar />
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={shouldAnimatePage ? { opacity: 0, scale: 0.98 } : { opacity: 1, scale: 1 }}
            animate={shouldAnimatePage ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1 }}
            exit={shouldAnimatePage ? { opacity: 0, scale: 0.98 } : { opacity: 1, scale: 1 }}
            transition={shouldAnimatePage ? { duration: 0.22, ease: "easeOut" } : { duration: 0 }}
            className="flex-1 flex flex-col"
          >
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              {/* <Route element={<AuthAwareLayout />}> */}
                <Route path="/about" element={<About />} />
                <Route path="/team" element={<Team2 />} />
                <Route path="/events" element={<Events />} />
                <Route path="/uploadevent">
                  <Route path="link/:token" element={<UploadEventByLink />} />
                  <Route element={<EventDashboardLayout />}>
                    <Route index element={<Navigate to="/uploadevent/upload" replace />} />
                    <Route path="upload" element={<UploadNewEvent />} />
                    <Route path="generate-link" element={<GenerateLink />} />
                    <Route path="departments" element={<DepartmentsAllowed />} />
                    <Route path="force-delete" element={<ForceDeletePermissions />} />
                    <Route path="manage" element={<ManageEvents />} />
                    <Route path="upcoming" element={<UpcomingEventPage />} />
                  </Route>
                </Route>
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/signup" element={<Signup />} />
                <Route
                  path="/dashboard"
                  element={
                    <RequireRole roles={["ADMIN", "Chairperson", "Vice-Chairperson"]}>
                      <AdminSignupConfig />
                    </RequireRole>
                  }
                />
                <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
                <Route
                  path="/profile"
                  element={
                    <RequireAuth>
                      <Profile />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/manage-team"
                  element={
                    <RequireAuth>
                      <ManageTeam />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/manage-society"
                  element={
                    <RequireSocietyScoped>
                      <ManageSociety />
                    </RequireSocietyScoped>
                  }
                />
                <Route
                  path="/college-admin"
                  element={
                    <RequireRole roles={["CollegeAdmin"]}>
                      <UniversityAdminDashboard />
                    </RequireRole>
                  }
                />
                <Route
                  path="/university-admin"
                  element={
                    <RequireRole roles={["UniversityAdmin"]}>
                      <UniversityLevelAdminDashboard />
                    </RequireRole>
                  }
                />
                <Route
                  path="/faculty-dashboard"
                  element={
                    <RequireRole roles={["ADMIN", "Chairperson", "Vice-Chairperson"]}>
                      <FacultyDashboard />
                    </RequireRole>
                  }
                />
                <Route path="/join-team/:token" element={<JoinTeamByLink />} />
                <Route path="/notfound" element={<NotFound></NotFound>} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/bentogrid" element={<GFGBentoGrid />} />
                <Route path="/results" element={<ResultPage />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/quiz/result" element={<QuizResult />} />
                <Route
                  path="/interview-setup"
                  element={
                    <RequireRole roles={["ADMIN", "Chairperson", "Vice-Chairperson"]}>
                      <InterviewSetup />
                    </RequireRole>
                  }
                />
                <Route
                  path="/interview-dashboard"
                  element={
                    <RequireRole roles={["ADMIN", "Chairperson", "Vice-Chairperson"]}>
                      <InterviewDashboard />
                    </RequireRole>
                  }
                />
                <Route
                  path="/my-interview"
                  element={
                    <RequireAuth>
                      <MyInterview />
                    </RequireAuth>
                  }
                />
              {/* </Route> */}
            </Routes>
          </motion.main>
        </AnimatePresence>
      </div>
      </AuthProvider>
    </FeatureFlagsProvider>
  )
}
export default App
