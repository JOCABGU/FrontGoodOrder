import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Card from "../components/Card";
import { getDocenteMaterias, getInscripciones, logout } from "../api";
import { useSession } from "../session";
import "../styless/layouts/dashboard.css";

function sortByHora(a, b) {
  const ah = a.hora_inicio || "99:99:99";
  const bh = b.hora_inicio || "99:99:99";
  return ah.localeCompare(bh);
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { session, setSession } = useSession();
  const [inscripciones, setInscripciones] = useState([]);
  const [docenteMaterias, setDocenteMaterias] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [inscripcionesData, docenteMateriasData] = await Promise.all([
          getInscripciones(session.token),
          getDocenteMaterias(session.token),
        ]);

        if (active) {
          setInscripciones(inscripcionesData.filter((item) => item.id_estudiante === session.user.id));
          setDocenteMaterias(docenteMateriasData);
        }
      } catch {
        if (active) {
          setInscripciones([]);
          setDocenteMaterias([]);
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

  const agenda = useMemo(() => {
    const materiasPorId = new Map(docenteMaterias.map((item) => [item.id_dm, item]));

    return inscripciones
      .map((inscripcion) => materiasPorId.get(inscripcion.id_dm))
      .filter(Boolean)
      .map((item) => ({
        id: item.id_dm,
        materia: item.materia?.nombre || "Materia sin nombre",
        docente: item.docente?.nombre || "Docente no disponible",
        modulo: item.modulo?.nombre || "Sin modulo",
        horario: item.horario?.nombre || "Horario no definido",
        hora_inicio: item.horario?.hora_inicio || "",
        hora_fin: item.horario?.hora_fin || "",
      }))
      .sort(sortByHora);
  }, [inscripciones, docenteMaterias]);

  const materias = useMemo(() => agenda.map((item) => item.materia), [agenda]);

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
      <Sidebar
        items={[
          { label: "Home", active: true },
          { label: "Mis materias" },
          { label: "Agenda" },
        ]}
      />

      <main className="dashboard">
        <div className="topbar">
          <span>Portal / Estudiante</span>
          <div className="top-actions">
            <span className="badge">ESTUDIANTE</span>
            <button className="logout" onClick={handleLogout}>Cerrar sesion</button>
          </div>
        </div>

        <h1>Panel estudiante</h1>
        <p className="subtitle">Visualiza tus materias y tu agenda de clases.</p>

        <div className="stats-grid">
          <Card title="Materias inscritas">
            <h2>{loading ? "..." : materias.length}</h2>
            <p>Total de materias vinculadas en inscripciones.</p>
          </Card>

          <Card title="ID estudiante">
            <h2>{session.user.id}</h2>
            <p>Identificador del usuario autenticado.</p>
          </Card>

          <Card title="Modulo actual">
            <h2>{session.user.id_modulo || "-"}</h2>
            <p>Modulo asignado en el backend.</p>
          </Card>
        </div>

        <div className="grid two">
          <Card title="Perfil del estudiante">
            <p><strong>Nombre:</strong> {session.user.nombre}</p>
            <p><strong>ID:</strong> {session.user.id}</p>
            <p><strong>Correo:</strong> {session.user.correo}</p>
            <p><strong>Universidad ID:</strong> {session.user.id_universidad}</p>
          </Card>

          <Card title="Mis materias">
            {loading ? <p>Cargando materias...</p> : null}
            {!loading && materias.length === 0 ? <p>No tienes materias inscritas.</p> : null}
            {materias.map((nombre, index) => (
              <div key={`${nombre}-${index}`} className="subject-item">
                <h4>{nombre}</h4>
              </div>
            ))}
          </Card>
        </div>

        <Card title="Mi agenda">
          {loading ? <p>Cargando agenda...</p> : null}
          {!loading && agenda.length === 0 ? <p>No hay clases programadas para tus inscripciones.</p> : null}

          {agenda.map((item) => (
            <div key={item.id} className="subject-item" style={{ marginBottom: "12px" }}>
              <h4>{item.materia}</h4>
              <p><strong>Bloque:</strong> {item.horario}</p>
              <p><strong>Hora:</strong> {item.hora_inicio || "--:--"} - {item.hora_fin || "--:--"}</p>
              <p><strong>Docente:</strong> {item.docente}</p>
              <p><strong>Modulo:</strong> {item.modulo}</p>
            </div>
          ))}
        </Card>
      </main>
    </div>
  );
}
