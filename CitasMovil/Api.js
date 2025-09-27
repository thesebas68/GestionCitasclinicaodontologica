import axios from "axios";

// URL del backend - importante para React Native
let API_URL = "http://192.168.20.24/GestionCitasclinicaodontologica";

// Log de la URL para debugging
console.log("API URL:", API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Interceptor para debugging
api.interceptors.request.use(
  (config) => {
    console.log(`🔄 ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error("❌ Error en request:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.url}:`, response.data);
    return response;
  },
  (error) => {
    console.error(`❌ Error ${error.response?.status} en ${error.config?.url}:`, error.response?.data);
    return Promise.reject(error);
  }
);

// Funciones para gestionar pacientes
export const obtenerPacientes = async () => {
  try {
    const response = await api.get("/ListarPacientes.php");
    // Asumiendo que tu PHP devuelve un array directamente o {data: array}
    return Array.isArray(response.data) ? response.data : response.data.data || [];
  } catch (error) {
    console.error("Error al obtener pacientes:", error);
    throw new Error(error.response?.data?.message || "Error al cargar pacientes");
  }
};

export const agregarPaciente = async (paciente) => {
  try {
    const response = await api.post("/Crear_Paciente.php", paciente);
    return response.data;
  } catch (error) {
    console.error("Error al agregar paciente:", error);
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      "No se pudo agregar el paciente"
    );
  }
};

// Funciones para gestionar citas
export const obtenerCitas = async () => {
  try {
    const response = await api.get("/ListarCita.php");
    // Asumiendo que tu PHP devuelve un array directamente o {data: array}
    return Array.isArray(response.data) ? response.data : response.data.data || [];
  } catch (error) {
    console.error("Error al obtener citas:", error);
    throw new Error(error.response?.data?.message || "Error al cargar citas");
  }
};

export const agregarCita = async (cita) => {
  try {
    const response = await api.post("/Crear_Cita.php", cita);
    return response.data;
  } catch (error) {
    console.error("Error al agregar cita:", error);
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      "No se pudo agregar la cita"
    );
  }
};

export const actualizarCita = async (id, cita) => {
  try {
    // IMPORTANTE: Tu PHP espera POST, no PUT
    const response = await api.post("/Actualizar_Cita.php", { ...cita, id });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar cita:", error);
    throw new Error(
      error.response?.data?.message ||
      "No se pudo actualizar la cita"
    );
  }
};

export const actualizarEstadoCita = async (id, estado) => {
  try {
    const response = await api.post("/Cambiar_Estado_Cita.php", { id, estado });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    throw new Error(
      error.response?.data?.message ||
      "No se pudo actualizar el estado"
    );
  }
};

export const eliminarCita = async (id) => {
  try {
    // IMPORTANTE: Tu PHP espera POST con JSON body, no DELETE con query param
    const response = await api.post("/Eliminar_Cita.php", { id });
    return response.data;
  } catch (error) {
    console.error("Error al eliminar cita:", error);
    throw new Error(
      error.response?.data?.message ||
      "No se pudo eliminar la cita"
    );
  }
};

export default {
  // Pacientes
  obtenerPacientes,
  agregarPaciente,
  
  // Citas
  obtenerCitas,
  agregarCita,
  actualizarCita,
  actualizarEstadoCita,
  eliminarCita,
};