import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createDocenteMateria,
  createHorario,
  createMateria,
  createUniversidad,
  getAsignacionesSugeridas,
  getCarreras,
  getDocenteMaterias,
  getDocentes,
  getEstudiantes,
  getHorarios,
  getInscripciones,
  getMaterias,
  getModulos,
  getSemestres,
  inscribirCohorte,
  logout,
} from "../api";
import { useSession } from "../session";
import "../styless/pages/coordinator.css";

const sections = [
  ["resumen", "Resumen"],
  ["catalogo", "Catalogo"],
  ["planificador", "Planificador"],
  ["cohorte", "Cohorte"],
  ["agenda", "Agenda"],
];

export default function CoordinatorDashboard() {
  const navigate = useNavigate();
  const { session, setSession } = useSession();

  const [active, setActive] = useState("resumen");
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [modal, setModal] = useState("");

  const [carreras, setCarreras] = useState([]);
  const [semestres, setSemestres] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [docenteMaterias, setDocenteMaterias] = useState([]);
  const [inscripciones, setInscripciones] = useState([]);

  const [filter, setFilter] = useState({ id_carrera: "", id_semestre: "", id_modulo: "", id_materia: "" });
  const [sugerencias, setSugerencias] = useState([]);
  const [assign, setAssign] = useState({ id_docente: "", id_horario: "" });

  const [newMateria, setNewMateria] = useState({ nombre: "", id_carrera: "", id_semestre: "" });
  const [newUni, setNewUni] = useState("");
  const [newHorario, setNewHorario] = useState({ nombre: "", hora_inicio: "", hora_fin: "" });
  const [agendaEstudiante, setAgendaEstudiante] = useState("");

  const loadAll = async () => {
    setLoading(true);
    try {
      const [carrs, sems, mods, mats, docs, ests, hors, dms, ins] = await Promise.all([
        getCarreras(session.token),
        getSemestres(session.token),
        getModulos(session.token),
        getMaterias(session.token),
        getDocentes(session.token),
        getEstudiantes(session.token),
        getHorarios(session.token),
        getDocenteMaterias(session.token),
        getInscripciones(session.token),
      ]);
      setCarreras(carrs);
      setSemestres(sems);
      setModulos(mods);
      setMaterias(mats);
      setDocentes(docs);
      setEstudiantes(ests);
      setHorarios(hors);
      setDocenteMaterias(dms);
      setInscripciones(ins);
    } catch (e) {
      setFeedback(e.message || "No se pudo cargar datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    const fetchSugerencias = async () => {
      if (!filter.id_carrera || !filter.id_semestre || !filter.id_modulo || !filter.id_materia) {
        setSugerencias([]);
        return;
      }
      try {
        const data = await getAsignacionesSugeridas(session.token, filter);
        setSugerencias(data.docentes || []);
      } catch (e) {
        setSugerencias([]);
        setFeedback(e.message || "No se pudo cargar sugerencias");
      }
    };
    fetchSugerencias();
  }, [filter, session.token]);

  const materiasFiltradas = useMemo(() => {
    if (!filter.id_carrera || !filter.id_semestre) return [];
    return materias.filter(
      (m) => Number(m.id_carrera) === Number(filter.id_carrera) && Number(m.id_semestre) === Number(filter.id_semestre)
    );
  }, [filter.id_carrera, filter.id_semestre, materias]);

  const modulosFiltrados = useMemo(() => {
    if (!filter.id_semestre) return [];
    return modulos.filter((m) => Number(m.id_semestre) === Number(filter.id_semestre));
  }, [filter.id_semestre, modulos]);

  const agenda = useMemo(() => {
    if (!agendaEstudiante) return [];
    return inscripciones
      .filter((x) => Number(x.id_estudiante) === Number(agendaEstudiante))
      .map((x) => x.docente_materia)
      .filter(Boolean)
      .map((dm) => ({
        materia: dm.materia?.nombre,
        docente: dm.docente?.nombre,
        horario: dm.horario?.nombre,
        tramo: `${dm.horario?.hora_inicio || "--"} - ${dm.horario?.hora_fin || "--"}`,
        modulo: dm.modulo?.nombre,
      }));
  }, [agendaEstudiante, inscripciones]);

  const handleLogout = async () => {
    try {
      await logout(session.token);
    } finally {
      setSession(null);
      navigate("/", { replace: true });
    }
  };

  const saveMateria = async (e) => {
    e.preventDefault();
    try {
      await createMateria(session.token, {
        nombre: newMateria.nombre,
        id_carrera: Number(newMateria.id_carrera),
        id_semestre: Number(newMateria.id_semestre),
      });
      setNewMateria({ nombre: "", id_carrera: "", id_semestre: "" });
      setFeedback("Materia creada.");
      await loadAll();
    } catch (e2) {
      setFeedback(e2.message || "No se pudo crear materia");
    }
  };

  const saveAsignacion = async (e) => {
    e.preventDefault();
    try {
      await createDocenteMateria(session.token, {
        id_docente: Number(assign.id_docente),
        id_materia: Number(filter.id_materia),
        id_modulo: Number(filter.id_modulo),
        id_horario: Number(assign.id_horario),
      });
      setAssign({ id_docente: "", id_horario: "" });
      setFeedback("Asignacion guardada.");
      await loadAll();
    } catch (e2) {
      setFeedback(e2.message || "No se pudo guardar asignacion");
    }
  };

  const runCohorte = async () => {
    try {
      const r = await inscribirCohorte(session.token, {
        id_carrera: Number(filter.id_carrera),
        id_semestre: Number(filter.id_semestre),
        id_modulo: Number(filter.id_modulo),
        id_materia: Number(filter.id_materia),
      });
      setFeedback(`Cohorte: ${r.creadas} creadas, ${r.omitidas} omitidas.`);
      await loadAll();
    } catch (e) {
      setFeedback(e.message || "No se pudo inscribir cohorte");
    }
  };

  return (
    <div className="go-layout">
      <aside className="go-sidebar">
        <div className="go-brand">GoodOrder</div>
        <p className="go-caption">Flujo de trabajo</p>
        <div className="go-nav">
          {sections.map(([id, label]) => (
            <button key={id} className={`go-nav-item ${active === id ? "active" : ""}`} onClick={() => setActive(id)}>{label}</button>
          ))}
        </div>
      </aside>

      <main className="go-main">
        <div className="go-topbar">
          <h2>{sections.find((x) => x[0] === active)?.[1]}</h2>
          <div className="go-top-actions">
            <button className="go-btn ghost" onClick={() => setModal("universidad")}>Universidad</button>
            <button className="go-btn ghost" onClick={() => setModal("horario")}>Horario</button>
            <button className="go-btn danger" onClick={handleLogout}>Salir</button>
          </div>
        </div>

        {feedback ? <p className="go-feedback">{feedback}</p> : null}
        {loading ? <p>Cargando...</p> : null}

        <section className="go-card go-process-card">
          <p className="go-process-title">Proceso recomendado</p>
          <div className="go-steps">
            <span className={filter.id_carrera ? "done" : ""}>1. Carrera</span>
            <span className={filter.id_semestre ? "done" : ""}>2. Semestre</span>
            <span className={filter.id_modulo ? "done" : ""}>3. Modulo</span>
            <span className={filter.id_materia ? "done" : ""}>4. Materia</span>
            <span className={assign.id_docente && assign.id_horario ? "done" : ""}>5. Docente + Horario</span>
          </div>
          <div className="go-grid-4">
            <select value={filter.id_carrera} onChange={(e) => setFilter({ id_carrera: e.target.value, id_semestre: "", id_modulo: "", id_materia: "" })}>
              <option value="">Carrera</option>
              {carreras.map((c) => <option key={c.id_carrera} value={c.id_carrera}>{c.nombre}</option>)}
            </select>
            <select value={filter.id_semestre} onChange={(e) => setFilter((p) => ({ ...p, id_semestre: e.target.value, id_modulo: "", id_materia: "" }))} disabled={!filter.id_carrera}>
              <option value="">Semestre</option>
              {semestres.map((s) => <option key={s.id_semestre} value={s.id_semestre}>{s.nombre}</option>)}
            </select>
            <select value={filter.id_modulo} onChange={(e) => setFilter((p) => ({ ...p, id_modulo: e.target.value }))} disabled={!filter.id_semestre}>
              <option value="">Modulo</option>
              {modulosFiltrados.map((m) => <option key={m.id_modulo} value={m.id_modulo}>{m.nombre}</option>)}
            </select>
            <select value={filter.id_materia} onChange={(e) => setFilter((p) => ({ ...p, id_materia: e.target.value }))} disabled={!filter.id_semestre || !filter.id_carrera}>
              <option value="">Materia</option>
              {materiasFiltradas.map((m) => <option key={m.id_materia} value={m.id_materia}>{m.nombre}</option>)}
            </select>
          </div>
        </section>

        {active === "resumen" ? (
          <div className="go-stats">
            <article className="go-card"><h4>Carreras</h4><p>{carreras.length}</p></article>
            <article className="go-card"><h4>Materias</h4><p>{materias.length}</p></article>
            <article className="go-card"><h4>Docentes</h4><p>{docentes.length}</p></article>
            <article className="go-card"><h4>Inscripciones</h4><p>{inscripciones.length}</p></article>
          </div>
        ) : null}

        {active === "catalogo" ? (
          <section className="go-card">
            <h4>Nueva materia</h4>
            <form onSubmit={saveMateria} className="go-grid-4">
              <input placeholder="Nombre" value={newMateria.nombre} onChange={(e) => setNewMateria((p) => ({ ...p, nombre: e.target.value }))} required />
              <select value={newMateria.id_carrera} onChange={(e) => setNewMateria((p) => ({ ...p, id_carrera: e.target.value }))} required>
                <option value="">Carrera</option>
                {carreras.map((c) => <option key={c.id_carrera} value={c.id_carrera}>{c.nombre}</option>)}
              </select>
              <select value={newMateria.id_semestre} onChange={(e) => setNewMateria((p) => ({ ...p, id_semestre: e.target.value }))} required>
                <option value="">Semestre</option>
                {semestres.map((s) => <option key={s.id_semestre} value={s.id_semestre}>{s.nombre}</option>)}
              </select>
              <button className="go-btn">Crear</button>
            </form>
          </section>
        ) : null}

        {active === "planificador" ? (
          <>
            <section className="go-card">
              <h4>Docentes sugeridos por disponibilidad</h4>
              {!filter.id_carrera || !filter.id_semestre || !filter.id_modulo || !filter.id_materia ? (
                <p className="go-muted-block">Completa los 4 filtros de proceso para ver sugerencias.</p>
              ) : (
                <div className="go-doc-grid">
                  {sugerencias.map((doc) => (
                    <article key={doc.id_docente} className="go-doc-card">
                      <h5>{doc.nombre} {doc.apellido || ""}</h5>
                      <div className="go-slot-grid">
                        {(doc.slots || []).map((slot) => (
                          <button
                            key={`${doc.id_docente}-${slot.label}`}
                            type="button"
                            className={`go-slot ${slot.ocupado ? "busy" : "free"}`}
                            onClick={() => {
                              if (slot.ocupado) return;
                              const h = horarios.find((x) => String(x.hora_inicio) === String(slot.hora_inicio) && String(x.hora_fin) === String(slot.hora_fin));
                              setAssign({ id_docente: String(doc.id_docente), id_horario: String(h?.id_horario || "") });
                            }}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    </article>
                  ))}
                  {sugerencias.length === 0 ? <p className="go-muted-block">Sin sugerencias para esta combinacion.</p> : null}
                </div>
              )}
            </section>

            <section className="go-card">
              <h4>Confirmar asignacion</h4>
              <form onSubmit={saveAsignacion} className="go-grid-3">
                <select value={assign.id_docente} onChange={(e) => setAssign((p) => ({ ...p, id_docente: e.target.value }))} required>
                  <option value="">Docente</option>
                  {sugerencias.map((d) => <option key={d.id_docente} value={d.id_docente}>{d.nombre} {d.apellido || ""}</option>)}
                </select>
                <select value={assign.id_horario} onChange={(e) => setAssign((p) => ({ ...p, id_horario: e.target.value }))} required>
                  <option value="">Horario</option>
                  {horarios.map((h) => <option key={h.id_horario} value={h.id_horario}>{h.nombre} ({h.hora_inicio}-{h.hora_fin})</option>)}
                </select>
                <button className="go-btn">Guardar</button>
              </form>
            </section>
          </>
        ) : null}

        {active === "cohorte" ? (
          <section className="go-card">
            <h4>Inscripcion masiva por cohorte</h4>
            <p className="go-muted-block">Usa los filtros del proceso y ejecuta inscripción para todos los estudiantes del modulo.</p>
            <button className="go-btn" onClick={runCohorte} disabled={!filter.id_carrera || !filter.id_semestre || !filter.id_modulo || !filter.id_materia}>Inscribir cohorte</button>
          </section>
        ) : null}

        {active === "agenda" ? (
          <section className="go-card">
            <h4>Agenda por estudiante</h4>
            <select value={agendaEstudiante} onChange={(e) => setAgendaEstudiante(e.target.value)}>
              <option value="">Seleccionar estudiante</option>
              {estudiantes.map((e) => <option key={e.id_estudiante} value={e.id_estudiante}>{e.nombre}</option>)}
            </select>
            <div className="go-agenda">
              {agenda.map((a, i) => (
                <div key={i} className="go-agenda-item">
                  <h5>{a.materia}</h5>
                  <p>{a.docente}</p>
                  <p>{a.horario} ({a.tramo})</p>
                  <p>{a.modulo}</p>
                </div>
              ))}
              {agendaEstudiante && agenda.length === 0 ? <p>Sin clases para ese estudiante.</p> : null}
            </div>
          </section>
        ) : null}

        {modal === "universidad" ? (
          <div className="go-modal-overlay" onClick={() => setModal("")}>
            <div className="go-modal" onClick={(e) => e.stopPropagation()}>
              <h4>Crear universidad</h4>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await createUniversidad(session.token, { nombre: newUni });
                  setNewUni("");
                  setModal("");
                  setFeedback("Universidad creada.");
                  await loadAll();
                } catch (er) {
                  setFeedback(er.message || "No se pudo crear universidad");
                }
              }}>
                <input value={newUni} onChange={(e) => setNewUni(e.target.value)} required placeholder="Nombre" />
                <div className="go-modal-actions"><button className="go-btn ghost" type="button" onClick={() => setModal("")}>Cancelar</button><button className="go-btn">Guardar</button></div>
              </form>
            </div>
          </div>
        ) : null}

        {modal === "horario" ? (
          <div className="go-modal-overlay" onClick={() => setModal("")}>
            <div className="go-modal" onClick={(e) => e.stopPropagation()}>
              <h4>Crear horario</h4>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await createHorario(session.token, newHorario);
                  setNewHorario({ nombre: "", hora_inicio: "", hora_fin: "" });
                  setModal("");
                  setFeedback("Horario creado.");
                  await loadAll();
                } catch (er) {
                  setFeedback(er.message || "No se pudo crear horario");
                }
              }}>
                <input value={newHorario.nombre} onChange={(e) => setNewHorario((p) => ({ ...p, nombre: e.target.value }))} required placeholder="Nombre" />
                <input type="time" value={newHorario.hora_inicio} onChange={(e) => setNewHorario((p) => ({ ...p, hora_inicio: e.target.value }))} required />
                <input type="time" value={newHorario.hora_fin} onChange={(e) => setNewHorario((p) => ({ ...p, hora_fin: e.target.value }))} required />
                <div className="go-modal-actions"><button className="go-btn ghost" type="button" onClick={() => setModal("")}>Cancelar</button><button className="go-btn">Guardar</button></div>
              </form>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
