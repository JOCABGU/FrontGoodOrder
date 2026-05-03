import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Card from "../components/Card";
import { getDocenteMaterias, logout } from "../api";
import { useSession } from "../session";
import "../styless/layouts/dashboard.css";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { session, setSession } = useSession();
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const data = await getDocenteMaterias(session.token);
        if (active) {
          setAsignaciones(data.filter((item) => item.id_docente === session.user.id));
        }
      } catch {
        if (active) {
          setAsignaciones([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [session.token, session.user.id]);

  const materias = useMemo(() => {
    return asignaciones
      .map((item) => ({
        nombre: item.materia?.nombre || "Materia sin nombre",
        modulo: item.modulo?.nombre || "Sin modulo",
      }));
  }, [asignaciones]);

  const handleLogout = async () => {
    try {
      await logout(session.token);
    } finally {
      setSession(null);
      navigate("/", { replace: true });
    }
  };

  return (
    <div className="layout">
      <Sidebar items={[{ label: "Home", active: true }, { label: "Materias" }]} />

      <main className="dashboard">
        <div className="topbar">
          <span>Portal / Docente</span>
          <div className="top-actions">
            <span className="badge">DOCENTE</span>
            <button className="logout" onClick={handleLogout}>Cerrar sesion</button>
          </div>
        </div>

        <h1>Panel docente</h1>
        <p className="subtitle">Tus asignaciones actuales desde la API GoodOrder.</p>

        <div className="grid two">
          <Card title="Perfil">
            <p><strong>Nombre:</strong> {session.user.nombre}</p>
            <p><strong>ID:</strong> {session.user.id}</p>
            <p><strong>Correo:</strong> {session.user.correo}</p>
            <p><strong>Universidad ID:</strong> {session.user.id_universidad}</p>
          </Card>

          <Card title="Resumen">
            <p><strong>Total asignaciones:</strong> {loading ? "..." : materias.length}</p>
            <p><strong>Rol:</strong> Docente</p>
          </Card>
        </div>

        <div className="section-title">
          <h2>Materias asignadas</h2>
          <span>{loading ? "Cargando..." : `${materias.length} registros`}</span>
        </div>

        {materias.length === 0 && !loading ? (
          <div className="empty-box">No tienes materias asignadas todavia.</div>
        ) : null}

        {materias.map((item, index) => (
          <div key={`${item.nombre}-${index}`} className="subject-item" style={{ marginBottom: "12px" }}>
            <h4>{item.nombre}</h4>
            <p>{item.modulo}</p>
          </div>
        ))}
      </main>
    </div>
  );
}
