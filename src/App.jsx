import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import TeacherDashboard from "./pages/TeacherDashboard";
import CoordinatorDashboard from "./pages/CoordinatorDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import { useSession } from "./session";

function roleRoute(session) {
  if (!session?.user) {
    return "/";
  }

  if (session.user.type === "estudiante") {
    return "/estudiante";
  }

  return session.user.es_jefe_carrera ? "/jefe" : "/docente";
}

function ProtectedRoute({ session, allow, element }) {
  if (!session?.token) {
    return <Navigate to="/" replace />;
  }

  const isAllowed = allow(session.user);
  return isAllowed ? element : <Navigate to={roleRoute(session)} replace />;
}

export default function App() {
  const { session } = useSession();

  return (
    <Routes>
      <Route
        path="/"
        element={session?.token ? <Navigate to={roleRoute(session)} replace /> : <LoginPage />}
      />
      <Route
        path="/docente"
        element={
          <ProtectedRoute
            session={session}
            allow={(user) => user.type === "docente" && !user.es_jefe_carrera}
            element={<TeacherDashboard />}
          />
        }
      />
      <Route
        path="/estudiante"
        element={
          <ProtectedRoute
            session={session}
            allow={(user) => user.type === "estudiante"}
            element={<StudentDashboard />}
          />
        }
      />
      <Route
        path="/jefe"
        element={
          <ProtectedRoute
            session={session}
            allow={(user) => user.type === "docente" && Boolean(user.es_jefe_carrera)}
            element={<CoordinatorDashboard />}
          />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
