import React, { useState, useEffect } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Alert,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

// Importar la API
import api from './Api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function App() {
  // States
  const [pacientes, setPacientes] = useState([]);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [patientModalVisible, setPatientModalVisible] = useState(false);
  const [appointmentModalVisible, setAppointmentModalVisible] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Form states
  const [patientForm, setPatientForm] = useState({
    nombre: '',
    documento: '',
    telefono: '',
    correo: ''
  });
  
  const [appointmentForm, setAppointmentForm] = useState({
    paciente_id: '',
    fecha: new Date(),
    hora: new Date(),
    odontologo: '',
    estado: 'pendiente'
  });
  
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Cargar datos al iniciar
  useEffect(() => {
    cargarDatos();
  }, []);

  // Filtrar pacientes
  const pacientesFiltrados = pacientes.filter(paciente =>
    paciente.nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paciente.documento?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paciente.correo?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtrar citas
  const citasFiltradas = citas.filter(cita => {
    const coincideEstado = statusFilter === 'all' || cita.estado === statusFilter;
    const coincideFecha = !dateFilter || cita.fecha === formatDate(dateFilter);
    return coincideEstado && coincideFecha;
  });

  // Funciones principales
  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [pacientesData, citasData] = await Promise.all([
        api.obtenerPacientes(),
        api.obtenerCitas()
      ]);
      setPacientes(pacientesData);
      setCitas(citasData);
    } catch (error) {
      mostrarAlerta('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const recargarDatos = async () => {
    try {
      setRefreshing(true);
      await cargarDatos();
      mostrarToast('Datos actualizados');
    } catch (error) {
      mostrarAlerta('Error', error.message);
    } finally {
      setRefreshing(false);
    }
  };

  // Funciones para pacientes
  const agregarPaciente = async () => {
    if (!patientForm.nombre.trim()) {
      mostrarAlerta('Error', 'El nombre es requerido');
      return;
    }

    try {
      const resultado = await api.agregarPaciente(patientForm);
      if (resultado.success) {
        mostrarToast('Paciente agregado correctamente');
        setPatientModalVisible(false);
        setPatientForm({ nombre: '', documento: '', telefono: '', correo: '' });
        await cargarDatos();
      } else {
        mostrarAlerta('Error', resultado.message);
      }
    } catch (error) {
      mostrarAlerta('Error', error.message);
    }
  };

  // Funciones para citas
  const agregarCita = async () => {
    if (!appointmentForm.paciente_id || !appointmentForm.fecha || !appointmentForm.hora) {
      mostrarAlerta('Error', 'Paciente, fecha y hora son requeridos');
      return;
    }

    try {
      const citaData = {
        paciente_id: parseInt(appointmentForm.paciente_id),
        fecha: formatDate(appointmentForm.fecha),
        hora: formatTime(appointmentForm.hora),
        odontologo: appointmentForm.odontologo,
        estado: appointmentForm.estado
      };

      let resultado;
      if (editingAppointmentId) {
        resultado = await api.actualizarCita(editingAppointmentId, citaData);
      } else {
        resultado = await api.agregarCita(citaData);
      }

      if (resultado.success) {
        mostrarToast(editingAppointmentId ? 'Cita actualizada' : 'Cita agregada');
        setAppointmentModalVisible(false);
        resetAppointmentForm();
        await cargarDatos();
      } else {
        mostrarAlerta('Error', resultado.message);
      }
    } catch (error) {
      mostrarAlerta('Error', error.message);
    }
  };

  const actualizarEstadoCita = async (id, nuevoEstado) => {
    try {
      const resultado = await api.actualizarEstadoCita(id, nuevoEstado);
      if (resultado.success) {
        mostrarToast('Estado actualizado');
        // Actualizar localmente sin recargar
        setCitas(citas.map(cita => 
          cita.id === id ? { ...cita, estado: nuevoEstado } : cita
        ));
      } else {
        mostrarAlerta('Error', resultado.message);
        await cargarDatos(); // Recargar si hay error
      }
    } catch (error) {
      mostrarAlerta('Error', error.message);
      await cargarDatos(); // Recargar si hay error
    }
  };

  const eliminarCita = async (id) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar esta cita?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const resultado = await api.eliminarCita(id);
              if (resultado.success) {
                mostrarToast('Cita eliminada');
                await cargarDatos();
              } else {
                mostrarAlerta('Error', resultado.message);
              }
            } catch (error) {
              mostrarAlerta('Error', error.message);
            }
          }
        }
      ]
    );
  };

  // Helper functions
  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const formatTime = (date) => {
    return date.toTimeString().split(' ')[0].substring(0, 5);
  };

  const mostrarToast = (mensaje) => {
    setToastMessage(mensaje);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const mostrarAlerta = (titulo, mensaje) => {
    Alert.alert(titulo, mensaje);
  };

  const resetAppointmentForm = () => {
    setAppointmentForm({
      paciente_id: '',
      fecha: new Date(),
      hora: new Date(),
      odontologo: '',
      estado: 'pendiente'
    });
    setEditingAppointmentId(null);
  };

  const editarCita = (cita) => {
    setAppointmentForm({
      paciente_id: cita.paciente_id.toString(),
      fecha: new Date(cita.fecha + 'T00:00:00'),
      hora: new Date('1970-01-01T' + cita.hora + ':00'),
      odontologo: cita.odontologo || '',
      estado: cita.estado
    });
    setEditingAppointmentId(cita.id);
    setAppointmentModalVisible(true);
  };

  const obtenerNombrePaciente = (pacienteId) => {
    const paciente = pacientes.find(p => p.id === pacienteId);
    return paciente ? paciente.nombre : '—';
  };

  const BadgeEstado = ({ estado }) => {
    const estilos = {
      pendiente: { backgroundColor: '#fef3c7', color: '#92400e' },
      confirmada: { backgroundColor: '#d1fae5', color: '#065f46' },
      cancelada: { backgroundColor: '#fecaca', color: '#991b1b' }
    };

    const textos = {
      pendiente: 'Pendiente',
      confirmada: 'Confirmada',
      cancelada: 'Cancelada'
    };

    return (
      <View style={[styles.badge, estilos[estado]]}>
        <Text style={[styles.badgeText, { color: estilos[estado].color }]}>
          {textos[estado]}
        </Text>
      </View>
    );
  };

  // Render items
  const renderPaciente = ({ item }) => (
    <View style={styles.pacienteCard}>
      <View style={styles.pacienteInfo}>
        <Text style={styles.pacienteNombre}>{item.nombre}</Text>
        <Text style={styles.pacienteDetalles}>{item.documento} • {item.telefono}</Text>
        <Text style={styles.pacienteEmail}>{item.correo}</Text>
      </View>
      <TouchableOpacity 
        style={styles.botonVer}
        onPress={() => {
          setStatusFilter('all');
          setDateFilter(null);
          // Filtrar citas por paciente
          const citasPaciente = citas.filter(cita => cita.paciente_id === item.id);
          setCitas(citasPaciente);
        }}
      >
        <Text style={styles.botonVerTexto}>Ver</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCita = ({ item }) => (
    <View style={styles.filaCita}>
      <View style={styles.celdaCita}>
        <Text style={styles.textoCita}>{obtenerNombrePaciente(item.paciente_id)}</Text>
      </View>
      <View style={styles.celdaCita}>
        <Text style={styles.textoCita}>{item.fecha}</Text>
      </View>
      <View style={styles.celdaCita}>
        <Text style={styles.textoCita}>{item.hora}</Text>
      </View>
      <View style={styles.celdaCita}>
        <Text style={styles.textoCita}>{item.odontologo || '—'}</Text>
      </View>
      <View style={styles.celdaCita}>
        <BadgeEstado estado={item.estado} />
      </View>
      <View style={[styles.celdaCita, styles.celdaAcciones]}>
        <View style={styles.contenedorAcciones}>
          <TouchableOpacity 
            style={styles.botonAccion}
            onPress={() => editarCita(item)}
          >
            <Text style={styles.textoBotonAccion}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.botonAccion, styles.botonEliminar]}
            onPress={() => eliminarCita(item.id)}
          >
            <Text style={[styles.textoBotonAccion, styles.textoEliminar]}>Eliminar</Text>
          </TouchableOpacity>
          <View style={styles.selectorEstado}>
            <Picker
              selectedValue={item.estado}
              style={styles.selector}
              onValueChange={(valor) => actualizarEstadoCita(item.id, valor)}
            >
              <Picker.Item label="Pendiente" value="pendiente" />
              <Picker.Item label="Confirmada" value="confirmada" />
              <Picker.Item label="Cancelada" value="cancelada" />
            </Picker>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.carga}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.textoCarga}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.contenedor}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIzquierda}>
          <Text style={styles.tituloHeader}>Clínica Odontológica</Text>
          <Text style={styles.subtituloHeader}>Gestión de pacientes y citas</Text>
        </View>
        <View style={styles.botonesHeader}>
          <TouchableOpacity 
            style={[styles.botonHeader, styles.botonPaciente]}
            onPress={() => setPatientModalVisible(true)}
          >
            <Text style={styles.textoBotonHeader}>Nuevo paciente</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.botonHeader, styles.botonCita]}
            onPress={() => {
              resetAppointmentForm();
              setAppointmentModalVisible(true);
            }}
          >
            <Text style={styles.textoBotonHeader}>Agendar cita</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contenido principal */}
      <ScrollView 
        style={styles.contenidoPrincipal}
        refreshControl={
          <ScrollView refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={recargarDatos} />
          } />
        }
      >
        {/* Panel de pacientes */}
        <View style={styles.panel}>
          <View style={styles.cabeceraPanel}>
            <Text style={styles.tituloPanel}>Pacientes ({pacientes.length})</Text>
          </View>
          
          <TextInput
            style={styles.busqueda}
            placeholder="Buscar por nombre, documento o correo"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          
          <FlatList
            data={pacientesFiltrados}
            renderItem={renderPaciente}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            ListEmptyComponent={
              <Text style={styles.listaVacia}>No hay pacientes registrados</Text>
            }
          />
        </View>

        {/* Panel de citas */}
        <View style={[styles.panel, styles.panelCitas]}>
          <View style={styles.cabeceraPanel}>
            <View>
              <Text style={styles.tituloPanel}>Citas ({citas.length})</Text>
              <Text style={styles.subtituloPanel}>Agenda y gestión rápida</Text>
            </View>
            
            <View style={styles.contenedorFiltros}>
              <Picker
                selectedValue={statusFilter}
                style={styles.filtroSelector}
                onValueChange={setStatusFilter}
              >
                <Picker.Item label="Todas" value="all" />
                <Picker.Item label="Pendientes" value="pendiente" />
                <Picker.Item label="Confirmadas" value="confirmada" />
                <Picker.Item label="Canceladas" value="cancelada" />
              </Picker>
              
              <TouchableOpacity 
                style={styles.botonFiltroFecha}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.textoFiltroFecha}>
                  {dateFilter ? dateFilter.toLocaleDateString() : 'Filtrar por fecha'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.botonLimpiar}
                onPress={() => {
                  setStatusFilter('all');
                  setDateFilter(null);
                }}
              >
                <Text style={styles.textoLimpiar}>Limpiar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tabla de citas */}
          <ScrollView horizontal>
            <View>
              {/* Encabezado de tabla */}
              <View style={styles.encabezadoTabla}>
                <Text style={[styles.celdaEncabezado, styles.anchoFijo]}>Paciente</Text>
                <Text style={[styles.celdaEncabezado, styles.anchoFijo]}>Fecha</Text>
                <Text style={[styles.celdaEncabezado, styles.anchoFijo]}>Hora</Text>
                <Text style={[styles.celdaEncabezado, styles.anchoFijo]}>Odontólogo</Text>
                <Text style={[styles.celdaEncabezado, styles.anchoFijo]}>Estado</Text>
                <Text style={[styles.celdaEncabezado, styles.anchoAcciones]}>Acciones</Text>
              </View>
              
              {/* Cuerpo de tabla */}
              <ScrollView style={styles.cuerpoTabla}>
                {citasFiltradas.length === 0 ? (
                  <View style={styles.estadoVacio}>
                    <Text style={styles.textoEstadoVacio}>No hay citas para mostrar</Text>
                  </View>
                ) : (
                  <FlatList
                    data={citasFiltradas}
                    renderItem={renderCita}
                    keyExtractor={(item) => item.id.toString()}
                    scrollEnabled={false}
                  />
                )}
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Modal de paciente */}
      <Modal
        visible={patientModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPatientModalVisible(false)}
      >
        <View style={styles.overlayModal}>
          <View style={styles.contenidoModal}>
            <View style={styles.cabeceraModal}>
              <Text style={styles.tituloModal}>Nuevo paciente</Text>
              <TouchableOpacity onPress={() => setPatientModalVisible(false)}>
                <Text style={styles.botonCerrar}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.cuerpoModal}>
              <TextInput
                style={styles.entrada}
                placeholder="Nombre completo *"
                value={patientForm.nombre}
                onChangeText={(texto) => setPatientForm({...patientForm, nombre: texto})}
              />
              <TextInput
                style={styles.entrada}
                placeholder="Documento"
                value={patientForm.documento}
                onChangeText={(texto) => setPatientForm({...patientForm, documento: texto})}
              />
              <TextInput
                style={styles.entrada}
                placeholder="Teléfono"
                value={patientForm.telefono}
                onChangeText={(texto) => setPatientForm({...patientForm, telefono: texto})}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.entrada}
                placeholder="Correo electrónico"
                value={patientForm.correo}
                onChangeText={(texto) => setPatientForm({...patientForm, correo: texto})}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </ScrollView>
            
            <View style={styles.pieModal}>
              <TouchableOpacity 
                style={styles.botonCancelar}
                onPress={() => setPatientModalVisible(false)}
              >
                <Text style={styles.textoBotonCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.botonGuardar}
                onPress={agregarPaciente}
              >
                <Text style={styles.textoBotonGuardar}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de cita */}
      <Modal
        visible={appointmentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAppointmentModalVisible(false)}
      >
        <View style={styles.overlayModal}>
          <View style={styles.contenidoModal}>
            <View style={styles.cabeceraModal}>
              <Text style={styles.tituloModal}>
                {editingAppointmentId ? 'Editar cita' : 'Agendar cita'}
              </Text>
              <TouchableOpacity onPress={() => setAppointmentModalVisible(false)}>
                <Text style={styles.botonCerrar}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.cuerpoModal}>
              <Text style={styles.etiqueta}>Paciente *</Text>
              <Picker
                selectedValue={appointmentForm.paciente_id}
                onValueChange={(valor) => setAppointmentForm({...appointmentForm, paciente_id: valor})}
                style={styles.selector}
              >
                <Picker.Item label="Seleccionar paciente" value="" />
                {pacientes.map(paciente => (
                  <Picker.Item 
                    key={paciente.id} 
                    label={`${paciente.nombre} - ${paciente.documento}`} 
                    value={paciente.id.toString()} 
                  />
                ))}
              </Picker>

              <View style={styles.fila}>
                <View style={styles.columna}>
                  <Text style={styles.etiqueta}>Fecha *</Text>
                  <TouchableOpacity 
                    style={styles.entradaFecha}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text>{appointmentForm.fecha.toLocaleDateString()}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.columna}>
                  <Text style={styles.etiqueta}>Hora *</Text>
                  <DateTimePicker
                    value={appointmentForm.hora}
                    mode="time"
                    is24Hour={true}
                    onChange={(event, fecha) => fecha && setAppointmentForm({...appointmentForm, hora: fecha})}
                    style={styles.selectorHora}
                  />
                </View>
              </View>

              <TextInput
                style={styles.entrada}
                placeholder="Odontólogo"
                value={appointmentForm.odontologo}
                onChangeText={(texto) => setAppointmentForm({...appointmentForm, odontologo: texto})}
              />

              <View style={styles.pieModal}>
                <Picker
                  selectedValue={appointmentForm.estado}
                  onValueChange={(valor) => setAppointmentForm({...appointmentForm, estado: valor})}
                  style={[styles.selector, styles.selectorEstado]}
                >
                  <Picker.Item label="Pendiente" value="pendiente" />
                  <Picker.Item label="Confirmada" value="confirmada" />
                  <Picker.Item label="Cancelada" value="cancelada" />
                </Picker>

                <View style={styles.accionesModal}>
                  <TouchableOpacity 
                    style={styles.botonCancelar}
                    onPress={() => setAppointmentModalVisible(false)}
                  >
                    <Text style={styles.textoBotonCancelar}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.botonGuardar}
                    onPress={agregarCita}
                  >
                    <Text style={styles.textoBotonGuardar}>
                      {editingAppointmentId ? 'Actualizar' : 'Agendar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Selector de fecha */}
      {showDatePicker && (
        <DateTimePicker
          value={dateFilter || new Date()}
          mode="date"
          onChange={(event, fecha) => {
            setShowDatePicker(false);
            if (fecha) setDateFilter(fecha);
          }}
        />
      )}

      {/* Toast */}
      {toastVisible && (
        <View style={styles.toast}>
          <Text style={styles.textoToast}>{toastMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

// Estilos (similar a los que te pasé anteriormente, pero en español)
const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#2563eb',
    paddingVertical: screenWidth < 480 ? 12 : 16,
    paddingHorizontal: 16,
    flexDirection: screenWidth < 480 ? 'column' : 'row',
    alignItems: screenWidth < 480 ? 'flex-start' : 'center',
    justifyContent: 'space-between',
  },
  tituloHeader: {
    fontSize: screenWidth < 480 ? 20 : 24,
    fontWeight: '700',
    color: '#fff',
  },
  subtituloHeader: {
    fontSize: screenWidth < 480 ? 14 : 16,
    color: '#e0f2fe',
    marginTop: screenWidth < 480 ? 4 : 0,
  },
  botonesHeader: {
    flexDirection: 'row',
    marginTop: screenWidth < 480 ? 10 : 0,
  },
  botonHeader: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginLeft: 8,
  },
  botonPaciente: {
    backgroundColor: '#facc15',
  },
  botonCita: {
    backgroundColor: '#22c55e',
  },
  textoBotonHeader: {
    color: '#fff',
    fontWeight: '600',
    fontSize: screenWidth < 480 ? 14 : 16,
  },

  contenidoPrincipal: {
    flex: 1,
    padding: 16,
  },
  panel: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  tituloPanel: {
    fontSize: screenWidth < 480 ? 18 : 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  busqueda: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginVertical: 10,
  },
  pacienteCard: {
    flexDirection: screenWidth < 480 ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: screenWidth < 480 ? 'flex-start' : 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pacienteNombre: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  pacienteDetalles: {
    fontSize: 14,
    color: '#4b5563',
  },
  pacienteEmail: {
    fontSize: 14,
    color: '#2563eb',
  },
  botonVer: {
    marginTop: screenWidth < 480 ? 8 : 0,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#2563eb',
    borderRadius: 10,
  },
  botonVerTexto: {
    color: '#fff',
    fontWeight: '600',
  },

  // Tabla citas responsiva
  encabezadoTabla: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    paddingVertical: 10,
    borderRadius: 8,
  },
  celdaEncabezado: {
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  filaCita: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
    paddingVertical: 12,
    alignItems: 'center',
  },
  celdaCita: {
    flex: 1,
    alignItems: 'center',
  },
  textoCita: {
    fontSize: 14,
    color: '#1f2937',
  },

  // Toast
  toast: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: '#111827',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 4,
  },
  textoToast: {
    color: '#fff',
    fontWeight: '600',
  },
});

// Necesario para el refresh control
const RefreshControl = ({ refreshing, onRefresh }) => {
  return (
    <ScrollView
      refreshControl={
        <ScrollView.RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
};