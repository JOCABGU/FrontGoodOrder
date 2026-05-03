const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

function getHeaders(token, extra = {}) {
  const headers = {
    Accept: "application/json",
    ...extra,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const message = data?.message || "Error de comunicacion con el servidor";
    throw new Error(message);
  }

  return data;
}

export async function login(payload) {
  return request("/auth/login", {
    method: "POST",
    headers: getHeaders(null, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
}

export async function getMe(token) {
  return request("/auth/me", {
    method: "GET",
    headers: getHeaders(token),
  });
}

export async function logout(token) {
  return request("/auth/logout", {
    method: "POST",
    headers: getHeaders(token, { "Content-Type": "application/json" }),
  });
}

export async function getDocenteMaterias(token) {
  return request("/docente-materias", {
    method: "GET",
    headers: getHeaders(token),
  });
}

export async function getInscripciones(token) {
  return request("/inscripciones", {
    method: "GET",
    headers: getHeaders(token),
  });
}

export async function getModulos(token) {
  return request("/modulos", {
    method: "GET",
    headers: getHeaders(token),
  });
}
export async function getSemestres(token) {
  return request("/semestres", {
    method: "GET",
    headers: getHeaders(token),
  });
}
export async function getHorarios(token) {
  return request("/horarios", {
    method: "GET",
    headers: getHeaders(token),
  });
}

export async function getDocentes(token) {
  return request("/docentes", {
    method: "GET",
    headers: getHeaders(token),
  });
}

export async function getEstudiantes(token) {
  return request("/estudiantes", {
    method: "GET",
    headers: getHeaders(token),
  });
}

export async function getMaterias(token) {
  return request("/materias", {
    method: "GET",
    headers: getHeaders(token),
  });
}
export async function getCarreras(token) {
  return request("/carreras", {
    method: "GET",
    headers: getHeaders(token),
  });
}
export async function getDisponibilidadDocentes(token) {
  return request("/disponibilidad-docentes", {
    method: "GET",
    headers: getHeaders(token),
  });
}
export async function getAsignacionesSugeridas(token, params) {
  const query = new URLSearchParams(params).toString();
  return request(`/asignaciones/sugeridas?${query}`, {
    method: "GET",
    headers: getHeaders(token),
  });
}

export async function createMateria(token, payload) {
  return request("/materias", {
    method: "POST",
    headers: getHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
}

export async function createDocenteMateria(token, payload) {
  return request("/docente-materias", {
    method: "POST",
    headers: getHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
}

export async function deleteDocenteMateria(token, id) {
  return request(`/docente-materias/${id}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
}

export async function createInscripcion(token, payload) {
  return request("/inscripciones", {
    method: "POST",
    headers: getHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
}

export async function deleteInscripcion(token, id) {
  return request(`/inscripciones/${id}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });
}
export async function inscribirCohorte(token, payload) {
  return request("/inscripciones/cohorte", {
    method: "POST",
    headers: getHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
}

export async function getHorarioIdeal(token) {
  return request("/horarios/configuracion-ideal", {
    method: "GET",
    headers: getHeaders(token),
  });
}

export async function createUniversidad(token, payload) {
  return request("/universidades", {
    method: "POST",
    headers: getHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });
}

export async function createHorario(token, payload) {
  const normalized = {
    ...payload,
    hora_inicio: payload.hora_inicio?.length === 5 ? `${payload.hora_inicio}:00` : payload.hora_inicio,
    hora_fin: payload.hora_fin?.length === 5 ? `${payload.hora_fin}:00` : payload.hora_fin,
  };

  return request("/horarios", {
    method: "POST",
    headers: getHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(normalized),
  });
}
