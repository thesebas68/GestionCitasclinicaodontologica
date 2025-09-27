
    let pacientes = [];
    let citas = [];

   // Helpers
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);

    // Elements
    const patientList = $("#patientList");
    const totalPatients = $("#totalPatients");
    const searchPatient = $("#searchPatient");

    const citasBody = $("#citasTableBody");
    const filterStatus = $("#filterStatus");
    const filterDate = $("#filterDate");
    const btnClearFilters = $("#btnClearFilters");

    // Modals
    const modalPatient = $("#modalPatient");
    const modalCita = $("#modalCita");
    const btnOpenPatient = $("#btnOpenPatient");
    const btnOpenCita = $("#btnOpenCita");

    // Forms
    const formPatient = $("#formPatient");
    const formCita = $("#formCita");
    const selectPacienteCita = $("#c_paciente");

    // Toast
    const toast = $("#toast");
    function showToast(text, time=2500){
      toast.textContent = text;
      toast.classList.remove("hidden");
      setTimeout(()=> toast.classList.add("hidden"), time);
    }

    // Render pacientes
    function renderPatients(list = pacientes){
      patientList.innerHTML = "";
      totalPatients.textContent = list.length;
      list.forEach(p => {
        const li = document.createElement("li");
        li.className = "p-3 rounded hover:bg-slate-50 flex items-start gap-3 border";
        li.innerHTML = `
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-start gap-4">
              <div>
                <div class="font-semibold">${escapeHtml(p.nombre)}</div>
                <div class="text-xs text-slate-500">${escapeHtml(p.documento)} • ${escapeHtml(p.telefono)}</div>
                <div class="text-xs text-slate-400 truncate-2">${escapeHtml(p.correo)}</div>
              </div>
              <div class="text-right">
                <button class="px-2 py-1 text-xs text-blue-600 hover:underline" data-id="${p.id}" onclick="viewPaciente(${p.id})">Ver</button>
              </div>
            </div>
          </div>`;
        patientList.appendChild(li);
      });
      populatePacienteSelect();
    }

    // Escape simple for display
    function escapeHtml (unsafe) {
      if (!unsafe) return "";
      return unsafe.replace(/[&<"'>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
    }

    function viewPaciente(id){
      const p = pacientes.find(x => x.id === id);
      if (!p) return;
      // Simple action: filter citas by paciente
      filterStatus.value = "all";
      filterDate.value = "";
      renderCitas({ pacienteId: id });
    }

    // Render citas con filtros
    function renderCitas(opts = {}) {
    const status = opts.status ?? filterStatus.value;
    const fecha = opts.fecha ?? filterDate.value;
    const pacienteId = opts.pacienteId ?? null;

    let rows = citas.slice();

    if (status && status !== "all") rows = rows.filter(r => r.estado === status);
    if (fecha) rows = rows.filter(r => r.fecha === fecha);
    if (pacienteId) rows = rows.filter(r => r.paciente_id === pacienteId);

    citasBody.innerHTML = "";

    if (rows.length === 0) {
        citasBody.innerHTML = `<tr><td class="py-6 px-3 text-center text-slate-500" colspan="6">No hay citas para mostrar</td></tr>`;
        return;
    }

    rows.forEach(c => {
        const paciente = pacientes.find(p => p.id === c.paciente_id);
        const tr = document.createElement("tr");
        tr.className = "hover:bg-slate-50";
        tr.innerHTML = `
            <td class="py-3 px-3 align-top">${escapeHtml(paciente?.nombre ?? "—")}</td>
            <td class="py-3 px-3 align-top">${c.fecha}</td>
            <td class="py-3 px-3 align-top">${c.hora}</td>
            <td class="py-3 px-3 align-top">${escapeHtml(c.odontologo || '—')}</td>
            <td class="py-3 px-3 align-top">
                ${statusBadge(c.estado)}
            </td>
            <td class="py-3 px-3 text-right align-top">
                <div class="flex justify-end gap-2">
                    <button class="px-2 py-1 text-xs border rounded hover:bg-slate-100" onclick="editCita(${c.id})">Editar</button>
                    <button class="px-2 py-1 text-xs border rounded text-red-600 hover:bg-red-50" onclick="deleteCita(${c.id})">Eliminar</button>
                    <div class="relative inline-block">
                        <select onchange="changeEstado(${c.id}, this.value)" 
                                class="text-xs border rounded px-2 py-1 bg-white hover:border-slate-400">
                            <option value="pendiente" ${c.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="confirmada" ${c.estado === 'confirmada' ? 'selected' : ''}>Confirmada</option>
                            <option value="cancelada" ${c.estado === 'cancelada' ? 'selected' : ''}>Cancelada</option>
                        </select>
                    </div>
                </div>
            </td>`;
        citasBody.appendChild(tr);
    });
}

    function statusBadge(estado) {
      if (estado === 'confirmada') return `<span class="px-2 py-1 rounded text-xs bg-emerald-100 text-emerald-800">Confirmada</span>`;
      if (estado === 'cancelada') return `<span class="px-2 py-1 rounded text-xs bg-rose-100 text-rose-800">Cancelada</span>`;
      return `<span class="px-2 py-1 rounded text-xs bg-amber-100 text-amber-800">Pendiente</span>`;
    }

    // Change estado inline
// Change estado inline - CON DEPURACIÓN
async function changeEstado(id, nuevoEstado) {
    console.log("Cambiando estado:", { id, nuevoEstado }); // Debug
    
    try {
        const res = await fetch("./Cambiar_Estado_Cita.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: parseInt(id), estado: nuevoEstado }) // Asegurar que sea número
        });
        
        console.log("Respuesta recibida:", res); // Debug
        
        const data = await res.json();
        console.log("Datos recibidos:", data); // Debug

        if (data.success) {
            showToast("Estado actualizado");
            // Actualizar el estado localmente
            const citaIndex = citas.findIndex(c => c.id === parseInt(id));
            console.log("Índice encontrado:", citaIndex); // Debug
            if (citaIndex !== -1) {
                citas[citaIndex].estado = nuevoEstado;
                renderCitas();
            } else {
                // Si no encuentra localmente, recargar
                loadCitas();
            }
        } else {
            showToast("Error: " + data.message);
            loadCitas();
        }
    } catch (err) {
        console.error("Error completo:", err); // Debug detallado
        showToast("Error al actualizar estado");
        loadCitas();
    }
}

    // Edit cita (cargar en modal para editar)
    function editCita(id){
      const c = citas.find(x => x.id == id);
      if (!c) return;
      openModal(modalCita);
      $("#c_paciente").value = c.paciente_id;
      $("#c_fecha").value = c.fecha;
      $("#c_hora").value = c.hora;
      $("#c_odontologo").value = c.odontologo || "";
      $("#c_estado").value = c.estado;
      formCita.dataset.edit = id;
    }

    // Populate select paciente para crear cita
    function populatePacienteSelect(){
      selectPacienteCita.innerHTML = "";
      pacientes.forEach(p => {
        const opt = document.createElement("option");
        opt.value = String(p.id);
        opt.textContent = `${p.nombre} — C.C. ${p.documento}`;
        selectPacienteCita.appendChild(opt);
      });
    }

    // Modal utilities
    function openModal(modal){
      modal.classList.remove("hidden");
      modal.classList.add("flex");
    }
    function closeModal(modal){
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      if (modal === modalCita) formCita.reset();
      if (modal === modalPatient) formPatient.reset();
      delete formCita.dataset.edit;
    }

    // Add patient
    formPatient.addEventListener("submit", async e => {
    e.preventDefault();

    const nombre = $("#p_nombre").value.trim();
    const documento = $("#p_documento").value.trim();
    const telefono = $("#p_telefono").value.trim();
    const correo = $("#p_correo").value.trim();

    if (!nombre) return showToast("Nombre requerido");

    try {
        const res = await fetch("Crear_Paciente.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, documento, telefono, correo })
        });

        const data = await res.json();

        if (data.success) {
        showToast("Paciente creado correctamente");
        formPatient.reset();
        closeModal(modalPatient);
        // recargar lista desde la BD
        loadPatients();
        } else {
        showToast("Error: " + data.message);
        }
    } catch (err) {
        console.error("Error guardando paciente", err);
        showToast("Error en el servidor");
    }
    });

    // Add/edit cita
    formCita.addEventListener("submit", async e => {
  e.preventDefault();

  const paciente_id = Number($("#c_paciente").value);
  const fecha = $("#c_fecha").value;
  const hora = $("#c_hora").value;
  const odontologo = $("#c_odontologo").value.trim();
  const estado = $("#c_estado").value;

  if (!paciente_id || !fecha || !hora) {
    return showToast("Completa los campos obligatorios");
  }

  try {
    if (formCita.dataset.edit) {
      // 🔹 EDITAR
      const id = Number(formCita.dataset.edit);
      const res = await fetch("Actualizar_Cita.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, paciente_id, fecha, hora, odontologo, estado })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Cita actualizada correctamente");
        closeModal(modalCita);
        loadCitas();
      } else {
        showToast("Error: " + data.message);
      }
    } else {
      // 🔹 CREAR
      const res = await fetch("Crear_Cita.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paciente_id, fecha, hora, odontologo, estado })
      });
      const data = await res.json();
      if (data.success) {
        showToast("Cita creada correctamente");
        closeModal(modalCita);
        loadCitas();
      } else {
        showToast("Error: " + data.message);
      }
    }
  } catch (err) {
    
    showToast("Error en el servidor",err);
  }

  delete formCita.dataset.edit; // limpiar flag
});


    //Eliminar cita
    async function deleteCita(id) {
    if (!confirm("¿Eliminar esta cita?")) return;
    try {
        const res = await fetch("Eliminar_Cita.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
        });
        const data = await res.json();

        if (data.success) {
        showToast("Cita eliminada");
        loadCitas();
        } else {
        showToast("Error: " + data.message);
        }
    } catch (err) {
        console.error(err);
        showToast("Error eliminando cita");
    }
    }    
    // Open modals
    btnOpenPatient.addEventListener("click", () => { openModal(modalPatient); });
    btnOpenCita.addEventListener("click", () => { openModal(modalCita); });
    $("#closePatient").addEventListener("click", () => closeModal(modalPatient));
    $("#cancelPatient").addEventListener("click", () => closeModal(modalPatient));
    $("#closeCita").addEventListener("click", () => closeModal(modalCita));
    $("#cancelCita").addEventListener("click", () => closeModal(modalCita));

    // Filters
    filterStatus.addEventListener("change", () => renderCitas());
    filterDate.addEventListener("change", () => renderCitas());
    btnClearFilters.addEventListener("click", () => { filterStatus.value = "all"; filterDate.value = ""; renderCitas(); });

    // Search patients live
    searchPatient.addEventListener("input", (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (!q) return renderPatients();
      const filtered = pacientes.filter(p => 
        (p.nombre || "").toLowerCase().includes(q) ||
        (p.documento || "").toLowerCase().includes(q) ||
        (p.correo || "").toLowerCase().includes(q)
      );
      renderPatients(filtered);
    });

    // Cargar pacientes desde la BD
    async function loadPatients() {
    try {
        const res = await fetch("ListarPacientes.php");
        pacientes = await res.json();
        renderPatients();
    } catch (err) {
        console.error("Error cargando pacientes", err);
        showToast("No se pudieron cargar pacientes");
    }
        }
    async function loadCitas() {
        try {
            const res = await fetch("ListarCita.php");
            citas = await res.json();
            renderCitas();
        } catch (err) {
            console.error("Error cargando citas", err);
            showToast("No se pudieron cargar citas");
        }
    }

    // Inicializar
  
    loadPatients();
    loadCitas();

   
 