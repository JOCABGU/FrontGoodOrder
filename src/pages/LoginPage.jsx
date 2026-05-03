import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { login } from "../api";
import { useSession } from "../session";
import "../styless/pages/login.css";
import "../styless/layouts/dashboard.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setSession } = useSession();
  const [perfil, setPerfil] = useState("Estudiante");
  const [correo, setCorreo] = useState("estudiante001@goodorder.edu.bo");
  const [password, setPassword] = useState("UPB123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const role = perfil === "Estudiante" ? "estudiante" : "docente";

  const handlePerfilChange = (nextPerfil) => {
    setPerfil(nextPerfil);
    if (nextPerfil === "Estudiante") {
      setCorreo("estudiante001@goodorder.edu.bo");
    } else if (nextPerfil === "Docente") {
      setCorreo("docente03@goodorder.edu.bo");
    } else {
      setCorreo("docente01@goodorder.edu.bo");
    }
  };

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await login({
        correo,
        password,
        role,
        device_name: "front-certificacion",
      });

      const nextSession = {
        token: response.access_token,
        refreshToken: response.refresh_token,
        user: response.user,
      };

      setSession(nextSession);

      if (response.user.type === "estudiante") {
        navigate("/estudiante", { replace: true });
      } else if (response.user.es_jefe_carrera) {
        navigate("/jefe", { replace: true });
      } else {
        navigate("/docente", { replace: true });
      }
    } catch (err) {
      setError(err.message || "No se pudo iniciar sesion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout">
      <Sidebar
        items={[
          { label: "LOGIN", active: true },
          { label: "EXAMEN" },
          { label: "DOCENTE" },
          { label: "ESTUDIANTE" },
        ]}
      />

      <main className="center-content">
        <div className="grid-pattern" />

        {[...Array(8)].map((_, i) => (
          <span
            key={i}
            className="particle"
            style={{
              left: `${12 + i * 10}%`,
              bottom: `${8 + (i % 4) * 10}%`,
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              background: i % 2 === 0 ? "rgba(255, 77, 141, 0.8)" : "rgba(255, 140, 97, 0.7)",
              animation: `float-up ${3 + i * 0.7}s ease-out ${i * 0.5}s infinite`,
            }}
          />
        ))}

        <div className="login-card">
          <h1>Acceso al portal</h1>
          <p>Ingresa con tu perfil para abrir el workspace.</p>

          <div className="field">
            <label>Perfil</label>
            <select value={perfil} onChange={(e) => handlePerfilChange(e.target.value)}>
              <option>Estudiante</option>
              <option>Docente</option>
              <option>Jefe de carrera</option>
            </select>
          </div>

          <div className="field">
            <label>Correo</label>
            <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
          </div>

          <div className="field">
            <label>Contrasena</label>
            <div className="password-wrap">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          {error ? <p style={{ color: "#ff9999", marginBottom: "12px" }}>{error}</p> : null}

          <button className="btn-login" onClick={handleLogin} disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" /> Ingresando...
              </>
            ) : (
              "Entrar"
            )}
          </button>

          <span className="hint">
            Password default: <code>UPB123</code>
          </span>
        </div>
      </main>
    </div>
  );
}
