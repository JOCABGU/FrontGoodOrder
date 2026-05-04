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
  ["malla", "Malla por semestre"],
  ["catalogo", "Catalogo"],
  ["planificador", "Planificador"],
  ["cohorte", "Cohorte"],
  ["agenda", "Agenda"],
];

export default function CoordinatorDashboard() {
  const navigate = useNavigate();
  const { session, setSession } = useSession();

  const [active, setActive] = useState("malla");
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
  const [selectedDocenteId, setSelectedDocenteId] = useState("");

  const [newMateria, setNewMateria] = useState({ nombre: "", id_carrera: "", id_semestre: "" });
  const [newUni, setNewUni] = useState("");
  const [newHorario, setNewHorario] = useState({ nombre: "", hora_inicio: "", hora_fin: "" });
  const [agendaEstudiante, setAgendaEstudiante] = useState("");
  const [agendaMonth, setAgendaMonth] = useState(new Date().getMonth());
  const [agendaSlotDetail, setAgendaSlotDetail] = useState(null);

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
        const docs = data.docentes || [];
        setSugerencias(docs);
        setSelectedDocenteId((prev) => {
          if (prev && docs.some((d) => String(d.id_docente) === String(prev))) return prev;
          return docs[0] ? String(docs[0].id_docente) : "";
        });
      } catch (e) {
        setSugerencias([]);
        setSelectedDocenteId("");
        setFeedback(e.message || "No se pudo cargar sugerencias");
      }
    };
    fetchSugerencias();
  }, [filter, session.token]);

  const materiasFiltradas = useMemo(() => {
    if (!filter.id_carrera || !filter.id_semestre) return [];
    return materias.filter((m) => {
      const okCarrera = Number(m.id_carrera) === Number(filter.id_carrera);
      const okSemestre = Number(m.id_semestre) === Number(filter.id_semestre);
      const yaAsignada = docenteMaterias.some((dm) => Number(dm.id_materia) === Number(m.id_materia));
      return okCarrera && okSemestre && !yaAsignada;
    });
  }, [filter.id_carrera, filter.id_semestre, materias, docenteMaterias]);

  const modulosFiltrados = useMemo(() => {
    if (!filter.id_semestre) return [];
    return modulos.filter((m) => Number(m.id_semestre) === Number(filter.id_semestre));
  }, [filter.id_semestre, modulos]);

  const materiaDocenteMap = useMemo(() => {
    const map = new Map();
    docenteMaterias.forEach((dm) => {
      if (!map.has(dm.id_materia)) {
        map.set(dm.id_materia, dm.docente?.nombre || null);
      }
    });
    return map;
  }, [docenteMaterias]);

  const horarioLabelMap = useMemo(() => {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const sorted = [...horarios].sort((a, b) => {
      const aIni = String(a.hora_inicio || "");
      const bIni = String(b.hora_inicio || "");
      return aIni.localeCompare(bIni);
    });
    const map = new Map();
    sorted.forEach((h, idx) => {
      map.set(Number(h.id_horario), letters[idx] || `B${idx + 1}`);
    });
    return map;
  }, [horarios]);

  const mallaMaterias = useMemo(() => {
    if (!filter.id_semestre) return [];
    return materias.filter((m) => Number(m.id_semestre) === Number(filter.id_semestre));
  }, [filter.id_semestre, materias]);

  const mallaPorModuloHorario = useMemo(() => {
    if (!filter.id_semestre) return [];

    const materiasBase = materias.filter((m) => {
      const okSemestre = Number(m.id_semestre) === Number(filter.id_semestre);
      const okCarrera = !filter.id_carrera || Number(m.id_carrera) === Number(filter.id_carrera);
      return okSemestre && okCarrera;
    });

    const grouped = new Map();

    const seenMateria = new Set();
    docenteMaterias.forEach((dm) => {
      const materia = materiasBase.find((m) => Number(m.id_materia) === Number(dm.id_materia));
      if (!materia) return;
      if (seenMateria.has(Number(materia.id_materia))) return;
      seenMateria.add(Number(materia.id_materia));

      const moduloObj = modulos.find((m) => Number(m.id_modulo) === Number(dm.id_modulo));
      const horarioObj = horarios.find((h) => Number(h.id_horario) === Number(dm.id_horario));
      const docenteNombre = dm.docente ? `${dm.docente.nombre || ""} ${dm.docente.apellido || ""}`.trim() : "Sin docente";
      const horarioLabel = horarioObj ? horarioLabelMap.get(Number(horarioObj.id_horario)) || horarioObj.nombre : "Pendiente";
      const moduloKey = String(dm.id_modulo || "sin-modulo");

      if (!grouped.has(moduloKey)) {
        grouped.set(moduloKey, {
          id_modulo: dm.id_modulo || null,
          moduloNombre: moduloObj?.nombre || "Sin modulo",
        items: [],
      });
    }

      grouped.get(moduloKey).items.push({
        id_materia: materia.id_materia,
        materiaNombre: materia.nombre,
        horarioNombre: horarioLabel,
        horarioTramo: horarioObj ? `${horarioObj.hora_inicio} - ${horarioObj.hora_fin}` : "",
        docenteNombre,
      });
    });

    const sinAsignacion = materiasBase.filter(
      (m) => !docenteMaterias.some((dm) => Number(dm.id_materia) === Number(m.id_materia))
    );

    if (sinAsignacion.length) {
      grouped.set("sin-asignacion", {
        id_modulo: null,
        moduloNombre: "Sin asignacion",
        items: sinAsignacion.map((m) => ({
          id_materia: m.id_materia,
          materiaNombre: m.nombre,
          horarioNombre: "Pendiente",
          horarioTramo: "",
          docenteNombre: "Sin docente",
        })),
      });
    }

    return Array.from(grouped.values());
  }, [filter.id_semestre, filter.id_carrera, materias, docenteMaterias, modulos, horarios, horarioLabelMap]);

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

  const sugerenciasOrdenadas = useMemo(() => {
    return [...sugerencias].sort((a, b) => {
      const aFree = (a.slots || []).filter((s) => !s.ocupado).length;
      const bFree = (b.slots || []).filter((s) => !s.ocupado).length;
      return bFree - aFree;
    });
  }, [sugerencias]);

  const docenteSeleccionado = useMemo(() => {
    if (!selectedDocenteId) return null;
    return sugerenciasOrdenadas.find((d) => String(d.id_docente) === String(selectedDocenteId)) || null;
  }, [selectedDocenteId, sugerenciasOrdenadas]);

  const moduloColorMap = useMemo(() => {
    const palette = ["#4ecb59", "#f0a7cb", "#60a5fa", "#fbbf24", "#34d399", "#f97316", "#a78bfa", "#22d3ee"];
    const map = new Map();
    modulos.forEach((m, idx) => map.set(Number(m.id_modulo), palette[idx % palette.length]));
    return map;
  }, [modulos]);

  const agendaMonths = useMemo(() => {
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const parseDate = (v) => {
      if (!v) return null;
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? null : d;
    };
    const year = new Date().getFullYear();

    return Array.from({ length: 12 }, (_, monthIdx) => {
      const start = new Date(year, monthIdx, 1);
      const end = new Date(year, monthIdx + 1, 0);
      const daysInMonth = end.getDate();
      const parts = [];

      modulos.forEach((m) => {
        if (filter.id_semestre && Number(m.id_semestre) !== Number(filter.id_semestre)) return;
        const d1 = parseDate(m.fecha_inicio);
        const d2 = parseDate(m.fecha_final);
        if (!d1 || !d2) return;
        const overlapStart = d1 > start ? d1 : start;
        const overlapEnd = d2 < end ? d2 : end;
        if (overlapEnd < overlapStart) return;
        const overlapDays = Math.floor((overlapEnd - overlapStart) / 86400000) + 1;
        const pct = (overlapDays / daysInMonth) * 100;
        const startDay = overlapStart.getDate();
        const leftPct = ((startDay - 1) / daysInMonth) * 100;
        parts.push({
          id_modulo: m.id_modulo,
          nombre: m.nombre,
          pct,
          leftPct,
          color: moduloColorMap.get(Number(m.id_modulo)) || "#4ecb59",
        });
      });

      if (parts.length === 0) parts.push({ id_modulo: null, nombre: "Sin modulo", pct: 100, leftPct: 0, color: "transparent" });
      return { monthIdx, name: monthNames[monthIdx], parts };
    });
  }, [modulos, moduloColorMap, filter.id_semestre]);

  const agendaDetalleMes = useMemo(() => {
    const selected = agendaMonths.find((m) => m.monthIdx === agendaMonth);
    if (!selected) return [];
    const modulosMes = selected.parts.filter((p) => p.id_modulo).map((p) => Number(p.id_modulo));
    const labelsAF = new Set(["A", "B", "C", "D", "E", "F"]);

    return modulosMes.map((idModulo) => {
      const mod = modulos.find((m) => Number(m.id_modulo) === Number(idModulo));
      const dms = docenteMaterias.filter((dm) => Number(dm.id_modulo) === Number(idModulo));
      const slots = dms
        .map((dm) => {
          const h = horarios.find((x) => Number(x.id_horario) === Number(dm.id_horario));
          const label = h ? (horarioLabelMap.get(Number(h.id_horario)) || h.nombre) : "";
          if (!labelsAF.has(String(label))) return null;
          return {
            label,
            docente: dm.docente ? `${dm.docente.nombre || ""} ${dm.docente.apellido || ""}`.trim() : "Sin docente",
            materia: dm.materia?.nombre || "Sin materia",
          };
        })
        .filter(Boolean)
        .sort((a, b) => a.label.localeCompare(b.label));
      return { id_modulo: idModulo, modulo: mod?.nombre || `Modulo ${idModulo}`, color: moduloColorMap.get(idModulo), slots };
    });
  }, [agendaMonths, agendaMonth, modulos, docenteMaterias, horarios, horarioLabelMap, moduloColorMap]);

  const moduloFechasAgenda = useMemo(() => {
    const fmt = (v) => {
      if (!v) return "--";
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return "--";
      return d.toLocaleDateString("es-BO", { day: "2-digit", month: "short" });
    };
    return modulos
      .filter((m) => !filter.id_semestre || Number(m.id_semestre) === Number(filter.id_semestre))
      .map((m) => ({
        id: m.id_modulo,
        nombre: m.nombre,
        color: moduloColorMap.get(Number(m.id_modulo)) || "#4ecb59",
        rango: `${fmt(m.fecha_inicio)} - ${fmt(m.fecha_final)}`,
      }));
  }, [modulos, filter.id_semestre, moduloColorMap]);

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
      const yaAsignada = docenteMaterias.some((dm) => Number(dm.id_materia) === Number(filter.id_materia));
      if (yaAsignada) {
        setFeedback("Esta materia ya tiene docente asignado. No se permite duplicar.");
        return;
      }
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
            <span className="go-build-tag">local-flujo-v3</span>
            <button className="go-btn ghost" onClick={() => setModal("universidad")}>Universidad</button>
            <button className="go-btn ghost" onClick={() => setModal("horario")}>Horario</button>
            <button className="go-btn danger" onClick={handleLogout}>Salir</button>
          </div>
        </div>

        {feedback ? <p className="go-feedback">{feedback}</p> : null}
        {loading ? <p>Cargando...</p> : null}

        {active !== "agenda" ? (
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
        ) : null}

        {active === "resumen" ? (
          <div className="go-stats">
            <article className="go-card"><h4>Carreras</h4><p>{carreras.length}</p></article>
            <article className="go-card"><h4>Materias</h4><p>{materias.length}</p></article>
            <article className="go-card"><h4>Docentes</h4><p>{docentes.length}</p></article>
            <article className="go-card"><h4>Inscripciones</h4><p>{inscripciones.length}</p></article>
          </div>
        ) : null}

        {active === "malla" ? (
          <section className="go-card">
            <h4>Malla por semestre</h4>
            <div className="go-grid-2">
              <select value={filter.id_semestre} onChange={(e) => setFilter((p) => ({ ...p, id_semestre: e.target.value }))}>
                <option value="">Filtrar por semestre</option>
                {semestres.map((s) => <option key={s.id_semestre} value={s.id_semestre}>{s.nombre}</option>)}
              </select>
              <select value={filter.id_carrera} onChange={(e) => setFilter((p) => ({ ...p, id_carrera: e.target.value }))}>
                <option value="">Filtrar por carrera</option>
                {carreras.map((c) => <option key={c.id_carrera} value={c.id_carrera}>{c.nombre}</option>)}
              </select>
            </div>

            {!filter.id_semestre ? (
              <p className="go-muted-block">Selecciona un semestre para ver materias.</p>
            ) : (
              <div className="go-modules-stack">
                {mallaPorModuloHorario.map((bloque) => (
                  <article key={String(bloque.id_modulo || bloque.moduloNombre)} className="go-module-box">
                    <h5>{bloque.moduloNombre}</h5>
                    <div className="go-malla-grid">
                      {bloque.items.map((item) => {
                        const sinDocente = item.docenteNombre === "Sin docente";
                        return (
                          <button
                            key={`${bloque.moduloNombre}-${item.id_materia}-${item.horarioNombre}`}
                            type="button"
                            className={`go-malla-card ${sinDocente ? "pending" : "ok"}`}
                            onClick={() => {
                              setFilter((p) => ({ ...p, id_materia: String(item.id_materia), id_modulo: String(bloque.id_modulo || "") }));
                              if (sinDocente) {
                                setActive("planificador");
                                setFeedback(`La materia ${item.materiaNombre} no tiene docente. Te llevamos a Planificador.`);
                              }
                            }}
                          >
                            {sinDocente ? <span className="go-dot" /> : null}
                            <h5>{item.materiaNombre}</h5>
                            <p>{item.horarioNombre}{item.horarioTramo ? ` (${item.horarioTramo})` : ""}</p>
                            <p>{sinDocente ? "Sin docente" : item.docenteNombre}</p>
                          </button>
                        );
                      })}
                    </div>
                  </article>
                ))}
                {mallaPorModuloHorario.length === 0 ? <p className="go-muted-block">No hay materias para ese semestre.</p> : null}
              </div>
            )}
          </section>
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
              ) : docenteMaterias.some((dm) => Number(dm.id_materia) === Number(filter.id_materia)) ? (
                <p className="go-muted-block">Esta materia ya tiene docente asignado. Si quieres cambiarlo, primero elimina la asignacion actual en backend.</p>
              ) : (
                <div className="go-doc-grid">
                  {sugerenciasOrdenadas.map((doc) => {
                    const libres = (doc.slots || []).filter((s) => !s.ocupado);
                    const ocupados = (doc.slots || []).filter((s) => s.ocupado);
                    return (
                      <article key={doc.id_docente} className={`go-doc-card compact ${String(selectedDocenteId) === String(doc.id_docente) ? "selected" : ""}`}>
                        <div className="go-doc-head">
                          <h5>{doc.nombre} {doc.apellido || ""}</h5>
                          <button type="button" className="go-btn ghost" onClick={() => setSelectedDocenteId(String(doc.id_docente))}>Ver horarios</button>
                        </div>
                        <p className="go-doc-meta">Libres: {libres.length} | Ocupados: {ocupados.length}</p>
                        <p className="go-doc-meta">Disponibles: {libres.slice(0, 8).map((s) => s.label).join(", ") || "Ninguno"}</p>
                      </article>
                    );
                  })}
                  {sugerencias.length === 0 ? <p className="go-muted-block">Sin sugerencias para esta combinacion.</p> : null}
                </div>
              )}
            </section>

            {docenteSeleccionado ? (
              <section className="go-card">
                <h4>Horarios de {docenteSeleccionado.nombre} {docenteSeleccionado.apellido || ""}</h4>
                <div className="go-slot-grid single-doc">
                  {(docenteSeleccionado.slots || []).map((slot) => (
                    <button
                      key={`${docenteSeleccionado.id_docente}-${slot.label}`}
                      type="button"
                      className={`go-slot ${slot.ocupado ? "busy" : "free"}`}
                      onClick={() => {
                        if (slot.ocupado) return;
                        const h = horarios.find((x) => String(x.hora_inicio) === String(slot.hora_inicio) && String(x.hora_fin) === String(slot.hora_fin));
                        setAssign({ id_docente: String(docenteSeleccionado.id_docente), id_horario: String(h?.id_horario || "") });
                      }}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

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
          <section className="go-card go-agenda-shell">
            <div className="go-agenda-headline">
              <h4>Vista general de módulos</h4>
              <button className="go-btn ghost" type="button">Ver calendario completo</button>
            </div>
            <div className="go-modulo-rangos go-modulo-rangos-top">
              {moduloFechasAgenda.map((m) => (
                <div key={m.id} className="go-modulo-rango">
                  <span className="go-module-chip" style={{ background: m.color }}></span>
                  <div>
                    <strong>{m.nombre}</strong>
                    <small>{m.rango}</small>
                  </div>
                </div>
              ))}
              {moduloFechasAgenda.length === 0 ? <p className="go-muted-block">Sin módulos para el semestre seleccionado.</p> : null}
            </div>
            <div className="go-month-grid modern">
              {agendaMonths.map((m) => (
                <button key={m.monthIdx} type="button" className={`go-month-card ${agendaMonth === m.monthIdx ? "active" : ""}`} onClick={() => setAgendaMonth(m.monthIdx)}>
                  <span className="go-month-title">{m.name}</span>
                  <div className="go-month-bar">
                    {m.parts.map((p, idx) => (
                      <span
                        key={`${m.monthIdx}-${idx}`}
                        style={{ left: `${p.leftPct}%`, width: `${p.pct}%`, background: p.color }}
                        title={p.nombre}
                      ></span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            <div className="go-agenda-detail modern">
              <h5>Detalle del mes: {agendaMonths.find((x) => x.monthIdx === agendaMonth)?.name}</h5>
              {agendaDetalleMes.map((mod) => (
                <article key={mod.id_modulo} className="go-module-agenda" style={{ borderColor: mod.color }}>
                  <div className="go-module-agenda-head">
                    <span className="go-module-chip" style={{ background: mod.color }}></span>
                    <strong>{mod.modulo}</strong>
                  </div>
                  <div className="go-slot-grid single-doc">
                    {["A", "B", "C", "D", "E", "F"].map((label) => {
                      const matches = mod.slots.filter((x) => x.label === label);
                      const s = matches[0];
                      const hasConflict = matches.length > 1;
                      return (
                        <button
                          key={`${mod.id_modulo}-${label}`}
                          type="button"
                          className={`go-slot ${s ? (hasConflict ? "overlap" : "free") : "unassigned"}`}
                          onClick={() => {
                            if (!matches.length) return;
                            setAgendaSlotDetail({
                              modulo: mod.modulo,
                              color: mod.color,
                              horario: label,
                              docentes: matches,
                            });
                          }}
                        >
                          <span className="go-slot-label">Bloque {label}</span>
                          <small>
                            {s
                              ? hasConflict
                                ? `${matches.length} docentes`
                                : `${s.docente}`
                              : "Sin asignar"}
                          </small>
                        </button>
                      );
                    })}
                  </div>
                </article>
              ))}
              {agendaDetalleMes.length === 0 ? <p className="go-muted-block">No hay módulos/horarios A-F en este mes.</p> : null}
            </div>
            {agendaSlotDetail ? (
              <div className="go-agenda-slot-detail">
                <div className="go-module-agenda-head">
                  <span className="go-module-chip" style={{ background: agendaSlotDetail.color }}></span>
                  <strong>{agendaSlotDetail.modulo} - Horario {agendaSlotDetail.horario}</strong>
                  <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
                    <button className="go-btn ghost" type="button">Exportar PDF</button>
                    <button className="go-btn" type="button" onClick={() => setAgendaSlotDetail(null)}>Cerrar</button>
                  </div>
                </div>
                <div className="go-agenda-detail-list">
                  {agendaSlotDetail.docentes.map((d, i) => (
                    <div key={`${d.docente}-${i}`} className="go-agenda-detail-item">
                      <strong>{d.docente}</strong>
                      <small>{d.materia}</small>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
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

