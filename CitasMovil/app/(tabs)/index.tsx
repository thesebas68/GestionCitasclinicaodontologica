import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
import api from '../../Api';

// Types (mantener igual)
interface Patient {
  id: number;
  nombre: string;
  documento: string;
  telefono: string;
  correo: string;
}

interface Appointment {
  id: number;
  paciente_id: number;
  fecha: string;
  hora: string;
  odontologo: string;
  estado: 'pendiente' | 'confirmada' | 'cancelada';
}

// Constants (mantener igual)
const STATUS_CONFIG = {
  pendiente: { label: 'Pendiente', backgroundColor: '#fef3c7', color: '#92400e' },
  confirmada: { label: 'Confirmada', backgroundColor: '#d1fae5', color: '#065f46' },
  cancelada: { label: 'Cancelada', backgroundColor: '#fecaca', color: '#991b1b' }
} as const;

export default function ClinicApp() {
  // States (mantener igual)
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [patientModalVisible, setPatientModalVisible] = useState(false);
  const [appointmentModalVisible, setAppointmentModalVisible] = useState(false);
  
  // Filter states (mantener igual)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendiente' | 'confirmada' | 'cancelada'>('all');
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // CORRECCIÓN: Nuevos estados para controlar los pickers del modal
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'date' | 'time'>('date');
  
  // Form states
  const [patientForm, setPatientForm] = useState({
    nombre: '',
    documento: '',
    telefono: '',
    correo: ''
  });
  
  // CORRECCIÓN: Estado del formulario de citas mejorado
  const [appointmentForm, setAppointmentForm] = useState({
    paciente_id: 0,
    fecha: new Date(),
    hora: new Date(),
    odontologo: '',
    estado: 'pendiente' as 'pendiente' | 'confirmada' | 'cancelada'
  });
  
  const [editingAppointmentId, setEditingAppointmentId] = useState<number | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Memoized data (mantener igual)
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    
    const query = searchQuery.toLowerCase();
    return patients.filter(patient =>
      patient.nombre.toLowerCase().includes(query) ||
      patient.documento.toLowerCase().includes(query) ||
      patient.correo.toLowerCase().includes(query)
    );
  }, [searchQuery, patients]);

  const filteredAppointments = useMemo(() => {
    let filtered = appointments;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.estado === statusFilter);
    }
    
    if (dateFilter) {
      const dateStr = dateFilter.toISOString().split('T')[0];
      filtered = filtered.filter(app => app.fecha === dateStr);
    }
    
    return filtered;
  }, [appointments, statusFilter, dateFilter]);

  // API functions (mantener igual)
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [pacientesData, citasData] = await Promise.all([
        api.obtenerPacientes(),
        api.obtenerCitas()
      ]);
      setPatients(pacientesData);
      setAppointments(citasData);
    } catch (error) {
      showToast('Error cargando datos');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    try {
      setRefreshing(true);
      await loadData();
      showToast('Datos actualizados');
    } catch (error) {
      showToast('Error actualizando datos');
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  // Effects (mantener igual)
  useEffect(() => {
    loadData();
  }, [loadData]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }, []);

  // CORRECCIÓN: Función resetAppointmentForm mejorada
  const resetAppointmentForm = useCallback(() => {
    const now = new Date();
    setAppointmentForm({
      paciente_id: 0,
      fecha: now,
      hora: now,
      odontologo: '',
      estado: 'pendiente'
    });
    setEditingAppointmentId(null);
    setShowDatePickerModal(false);
    setShowTimePickerModal(false);
  }, []);

  const getPatientName = useCallback((patientId: number) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.nombre : '—';
  }, [patients]);

  // CORRECCIÓN: Nuevas funciones para manejar los pickers del modal
  const handleDateChange = useCallback((event: any, selectedDate?: Date) => {
    setShowDatePickerModal(false);
    setShowTimePickerModal(false);
    
    if (selectedDate) {
      if (datePickerMode === 'date') {
        setAppointmentForm(prev => ({
          ...prev,
          fecha: selectedDate
        }));
      } else {
        setAppointmentForm(prev => ({
          ...prev,
          hora: selectedDate
        }));
      }
    }
  }, [datePickerMode]);

  const openDatePicker = useCallback((mode: 'date' | 'time') => {
    setDatePickerMode(mode);
    if (mode === 'date') {
      setShowDatePickerModal(true);
    } else {
      setShowTimePickerModal(true);
    }
  }, []);

  // Handlers (mantener igual con pequeñas correcciones)
  const handleCreatePatient = async () => {
    if (!patientForm.nombre.trim()) {
      showToast('Nombre requerido');
      return;
    }

    try {
      const result = await api.agregarPaciente(patientForm);
      if (result.success) {
        showToast('Paciente creado correctamente');
        setPatientModalVisible(false);
        setPatientForm({ nombre: '', documento: '', telefono: '', correo: '' });
        await loadData();
      } else {
        showToast('Error: ' + result.message);
      }
    } catch (error) {
      showToast('Error en el servidor');
      console.error('Error creating patient:', error);
    }
  };

  const handleCreateAppointment = async () => {
    if (!appointmentForm.paciente_id) {
      showToast('Seleccione un paciente');
      return;
    }

    try {
      const appointmentData = {
        paciente_id: appointmentForm.paciente_id,
        fecha: appointmentForm.fecha.toISOString().split('T')[0],
        hora: appointmentForm.hora.toTimeString().split(' ')[0].substring(0, 5),
        odontologo: appointmentForm.odontologo,
        estado: appointmentForm.estado
      };

      const result = editingAppointmentId 
        ? await api.actualizarCita(editingAppointmentId, appointmentData)
        : await api.agregarCita(appointmentData);

      if (result.success) {
        showToast(editingAppointmentId ? 'Cita actualizada' : 'Cita creada');
        setAppointmentModalVisible(false);
        resetAppointmentForm();
        await loadData();
      } else {
        showToast('Error: ' + result.message);
      }
    } catch (error) {
      showToast('Error en el servidor');
      console.error('Error creating/updating appointment:', error);
    }
  };

  // CORRECCIÓN: Función handleEditAppointment mejorada
  const handleEditAppointment = useCallback((appointment: Appointment) => {
    try {
      // Parsear fecha y hora de manera segura
      const [year, month, day] = appointment.fecha.split('-').map(Number);
      const fecha = new Date(year, month - 1, day);
      
      const [hours, minutes] = appointment.hora.split(':').map(Number);
      const hora = new Date();
      hora.setHours(hours, minutes, 0, 0);

      setAppointmentForm({
        paciente_id: appointment.paciente_id,
        fecha: isNaN(fecha.getTime()) ? new Date() : fecha,
        hora: isNaN(hora.getTime()) ? new Date() : hora,
        odontologo: appointment.odontologo,
        estado: appointment.estado
      });
      setEditingAppointmentId(appointment.id);
      setAppointmentModalVisible(true);
    } catch (error) {
      console.error('Error al preparar edición de cita:', error);
      showToast('Error al cargar la cita para editar');
    }
  }, []);

  // Resto de funciones mantienen igual...
  const handleUpdateAppointmentStatus = async (id: number, nuevoEstado: string) => {
    try {
      const result = await api.actualizarEstadoCita(id, nuevoEstado);
      if (result.success) {
        showToast('Estado actualizado');
        setAppointments(prev => prev.map(app => 
          app.id === id ? { ...app, estado: nuevoEstado as any } : app
        ));
      } else {
        showToast('Error: ' + result.message);
        await loadData();
      }
    } catch (error) {
      showToast('Error al actualizar estado');
      console.error('Error updating status:', error);
      await loadData();
    }
  };

  const handleDeleteAppointment = (id: number) => {
    Alert.alert(
      'Confirmar',
      '¿Eliminar esta cita?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await api.eliminarCita(id);
              if (result.success) {
                showToast('Cita eliminada');
                await loadData();
              } else {
                showToast('Error: ' + result.message);
              }
            } catch (error) {
              showToast('Error eliminando cita');
              console.error('Error deleting appointment:', error);
            }
          }
        }
      ]
    );
  };

  // Render components (mantener igual hasta el modal de citas)
  const StatusBadge = useCallback(({ estado }: { estado: string }) => {
    const config = STATUS_CONFIG[estado as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pendiente;
    
    return (
      <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
        <Text style={[styles.badgeText, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
    );
  }, []);

  const renderPatientItem = useCallback(({ item }: { item: Patient }) => (
    <View style={styles.patientCard}>
      <View style={styles.patientInfo}>
        <Text style={styles.patientName} numberOfLines={1}>{item.nombre}</Text>
        <Text style={styles.patientDetails} numberOfLines={1}>
          {item.documento} • {item.telefono}
        </Text>
        <Text style={styles.patientEmail} numberOfLines={1}>{item.correo}</Text>
      </View>
      <TouchableOpacity 
        style={styles.viewButton}
        onPress={() => {
          setStatusFilter('all');
          setDateFilter(null);
        }}
      >
        <Text style={styles.viewButtonText}>Ver</Text>
      </TouchableOpacity>
    </View>
  ), []);

  const renderAppointmentItem = useCallback(({ item }: { item: Appointment }) => (
    <View style={styles.appointmentRow}>
      <View style={styles.appointmentCell}>
        <Text style={styles.appointmentText} numberOfLines={1}>
          {getPatientName(item.paciente_id)}
        </Text>
      </View>
      <View style={styles.appointmentCell}>
        <Text style={styles.appointmentText}>{item.fecha}</Text>
      </View>
      <View style={styles.appointmentCell}>
        <Text style={styles.appointmentText}>{item.hora}</Text>
      </View>
      <View style={styles.appointmentCell}>
        <Text style={styles.appointmentText} numberOfLines={1}>
          {item.odontologo || '—'}
        </Text>
      </View>
      <View style={styles.appointmentCell}>
        <StatusBadge estado={item.estado} />
      </View>
      <View style={[styles.appointmentCell, styles.actionsCell]}>
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleEditAppointment(item)}
          >
            <Text style={styles.actionButtonText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteAppointment(item.id)}
          >
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Eliminar</Text>
          </TouchableOpacity>
          <View style={styles.statusPicker}>
            <Picker
              selectedValue={item.estado}
              style={styles.picker}
              onValueChange={(value) => handleUpdateAppointmentStatus(item.id, value)}
            >
              {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                <Picker.Item key={value} label={config.label} value={value} />
              ))}
            </Picker>
          </View>
        </View>
      </View>
    </View>
  ), [getPatientName, handleEditAppointment, StatusBadge]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Clínica | Panel</Text>
          <Text style={styles.headerSubtitle}>Gestión de pacientes y citas</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[styles.headerButton, styles.patientButton]}
            onPress={() => setPatientModalVisible(true)}
          >
            <Text style={styles.headerButtonText}>Nuevo paciente</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.headerButton, styles.appointmentButton]}
            onPress={() => {
              resetAppointmentForm();
              setAppointmentModalVisible(true);
            }}
          >
            <Text style={styles.headerButtonText}>Agendar cita</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.mainContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshData}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Patients Panel */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Pacientes ({patients.length})</Text>
          </View>
          
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, documento o correo"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          
          <View style={styles.patientsList}>
            <FlatList
              data={filteredPatients}
              renderItem={renderPatientItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No hay pacientes registrados</Text>
              }
            />
          </View>
        </View>

        {/* Appointments Panel */}
        <View style={[styles.panel, styles.appointmentsPanel]}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelTitle}>Citas ({appointments.length})</Text>
              <Text style={styles.panelSubtitle}>Agenda y gestión rápida</Text>
            </View>
            
            <View style={styles.filtersContainer}>
              <Picker
                selectedValue={statusFilter}
                style={styles.filterPicker}
                onValueChange={setStatusFilter}
              >
                <Picker.Item label="Todas" value="all" />
                {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                  <Picker.Item key={value} label={config.label + 's'} value={value} />
                ))}
              </Picker>
              
              <TouchableOpacity 
                style={styles.dateFilterButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateFilterText}>
                  {dateFilter ? dateFilter.toLocaleDateString() : 'Fecha'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.clearFilterButton}
                onPress={() => {
                  setStatusFilter('all');
                  setDateFilter(null);
                }}
              >
                <Text style={styles.clearFilterText}>Limpiar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Appointments Table */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, styles.fixedWidth]}>Paciente</Text>
                <Text style={[styles.headerCell, styles.fixedWidth]}>Fecha</Text>
                <Text style={[styles.headerCell, styles.fixedWidth]}>Hora</Text>
                <Text style={[styles.headerCell, styles.fixedWidth]}>Odontólogo</Text>
                <Text style={[styles.headerCell, styles.fixedWidth]}>Estado</Text>
                <Text style={[styles.headerCell, styles.actionsHeader]}>Acciones</Text>
              </View>
              
              {/* Table Body */}
              <View style={styles.tableBody}>
                {filteredAppointments.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No hay citas para mostrar</Text>
                  </View>
                ) : (
                  <FlatList
                    data={filteredAppointments}
                    renderItem={renderAppointmentItem}
                    keyExtractor={(item) => item.id.toString()}
                    scrollEnabled={false}
                  />
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Patient Modal */}
      <Modal
        visible={patientModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPatientModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo paciente</Text>
              <TouchableOpacity 
                onPress={() => setPatientModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <TextInput
                style={styles.input}
                placeholder="Nombre completo *"
                value={patientForm.nombre}
                onChangeText={(text) => setPatientForm({...patientForm, nombre: text})}
                returnKeyType="next"
              />
              <TextInput
                style={styles.input}
                placeholder="Documento"
                value={patientForm.documento}
                onChangeText={(text) => setPatientForm({...patientForm, documento: text})}
                returnKeyType="next"
              />
              <TextInput
                style={styles.input}
                placeholder="Teléfono"
                value={patientForm.telefono}
                onChangeText={(text) => setPatientForm({...patientForm, telefono: text})}
                keyboardType="phone-pad"
                returnKeyType="next"
              />
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                value={patientForm.correo}
                onChangeText={(text) => setPatientForm({...patientForm, correo: text})}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
              />
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setPatientModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleCreatePatient}
              >
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Appointment Modal */}
      <Modal
        visible={appointmentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setAppointmentModalVisible(false);
          resetAppointmentForm();
        }}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingAppointmentId ? 'Editar cita' : 'Agendar cita'}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setAppointmentModalVisible(false);
                  resetAppointmentForm();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalBodyContent}
            >
              <Text style={styles.label}>Paciente *</Text>
              <Picker
                selectedValue={appointmentForm.paciente_id}
                onValueChange={(value) => setAppointmentForm({...appointmentForm, paciente_id: value})}
                style={styles.picker}
              >
                <Picker.Item label="Seleccionar paciente" value={0} />
                {patients.map(patient => (
                  <Picker.Item 
                    key={patient.id} 
                    label={`${patient.nombre} — C.C. ${patient.documento}`} 
                    value={patient.id} 
                  />
                ))}
              </Picker>

              <View style={styles.row}>
                <View style={styles.column}>
                  <Text style={styles.label}>Fecha *</Text>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => openDatePicker('date')}
                  >
                    <Text style={styles.dateInput}>
                      {appointmentForm.fecha.toLocaleDateString('es-ES')}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.column}>
                  <Text style={styles.label}>Hora *</Text>
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => openDatePicker('time')}
                  >
                    <Text style={styles.dateInput}>
                      {appointmentForm.hora.toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.label}>Odontólogo</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre del odontólogo"
                value={appointmentForm.odontologo}
                onChangeText={(text) => setAppointmentForm({...appointmentForm, odontologo: text})}
                returnKeyType="done"
              />

              <Text style={styles.label}>Estado</Text>
              <Picker
                selectedValue={appointmentForm.estado}
                onValueChange={(value) => setAppointmentForm({...appointmentForm, estado: value})}
                style={[styles.picker, styles.modalStatusPicker]}
              >
                {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                  <Picker.Item key={value} label={config.label} value={value} />
                ))}
              </Picker>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    setAppointmentModalVisible(false);
                    resetAppointmentForm();
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleCreateAppointment}
                >
                  <Text style={styles.saveButtonText}>
                    {editingAppointmentId ? 'Actualizar' : 'Agendar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Date/Time Pickers CORREGIDOS */}
      {(showDatePickerModal || showTimePickerModal) && (
        <DateTimePicker
          value={datePickerMode === 'date' ? appointmentForm.fecha : appointmentForm.hora}
          mode={datePickerMode}
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      {/* Date Picker para filtros (mantener igual) */}
      {showDatePicker && (
        <DateTimePicker
          value={dateFilter || new Date()}
          mode="date"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setDateFilter(date);
          }}
        />
      )}

      {/* Toast (mantener igual) */}
      {toastVisible && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}


// Agrega estos estilos adicionales a tu objeto styles
const styles = StyleSheet.create({
  // Modal styles - Optimizados como bottom sheet móvil
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: screenWidth > 768 ? 24 : 20,
    width: '100%',
    maxHeight: screenHeight * 0.9,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: screenWidth > 768 ? 22 : 20,
    fontWeight: '700',
    color: '#2563eb',
    flex: 1,
  },
  closeButton: {
    fontSize: 28,
    color: '#dc2626',
    fontWeight: 'bold',
    padding: 12,
    margin: -12,
    minHeight: 48,
    minWidth: 48,
    textAlign: 'center',
    textAlignVertical: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  modalBody: {
    maxHeight: screenHeight * 0.6,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginVertical: 8,
    fontSize: screenWidth > 768 ? 18 : 16,
    color: '#1e293b',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modalFooter: {
    flexDirection: screenWidth < 480 ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  label: {
    fontSize: screenWidth > 768 ? 18 : 17,
    color: '#2563eb',
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 16,
  },

  // Layout optimizado para móvil con mejor jerarquía
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 20,
    paddingTop: screenHeight > 800 ? 60 : 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: screenWidth > 768 ? 26 : 22,
    fontWeight: '800',
    color: '#2563eb',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: screenWidth > 768 ? 16 : 15,
    color: '#64748b',
    lineHeight: 22,
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 10,
  },
  headerButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    minWidth: screenWidth > 768 ? 120 : 110,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    minHeight: 48,
  },
  patientButton: {
    backgroundColor: '#06b6d4',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    minWidth: screenWidth > 768 ? 120 : 110,
    alignItems: 'center',
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    minHeight: 48,
  },
  appointmentButton: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    minWidth: screenWidth > 768 ? 120 : 110,
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    minHeight: 48,
  },
  headerButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: screenWidth > 680 ? 16 : 15,
  },

  // Main content optimizado con mejor spacing
  mainContent: {
    flex: 1,
    padding: screenWidth > 680 ? 18 : 14,
  },

  // Panels mejorados para touch con mejor elevación
  panel: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginVertical: 10,
    padding: screenWidth > 680 ? 20 : 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  panelTitle: {
    fontSize: screenWidth > 680 ? 21 : 19,
    fontWeight: '700',
    color: '#2563eb',
  },
  panelSubtitle: {
    fontSize: screenWidth > 680 ? 16 : 15,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500',
  },

  // AÑADIDO: appointmentsPanel que faltaba con mejor espaciado
  appointmentsPanel: {
    marginTop: 22,
  },

  // Search input mejorado con mejor UX
  searchInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginVertical: 10,
    fontSize: screenWidth > 680 ? 18 : 16,
    color: '#1e293b',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    minHeight: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  // Patients list optimizada con mejor altura
  patientsList: {
    maxHeight: screenHeight * 0.28,
  },

  // Patient card mejorada para touch con mejor jerarquía visual
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginVertical: 8,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    minHeight: 88,
  },
  patientInfo: {
    flex: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  patientName: {
    fontSize: screenWidth > 680 ? 19 : 18,
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 6,
  },
  patientDetails: {
    fontSize: screenWidth > 680 ? 16 : 15,
    color: '#64748b',
    marginBottom: 4,
    lineHeight: 20,
    fontWeight: '500',
  },
  patientEmail: {
    fontSize: screenWidth > 680 ? 15 : 14,
    color: '#64748b',
    fontStyle: 'italic',
  },

  // Table styles adaptados a móvil con mejor legibilidad
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
  },
  headerCell: {
    fontWeight: '700',
    color: '#2563eb',
    fontSize: screenWidth > 680 ? 16 : 15,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  fixedWidth: {
    minWidth: screenWidth < 480 ? 75 : 90,
    flex: 1,
  },
  actionsHeader: {
    minWidth: screenWidth < 480 ? 130 : 150,
    flex: screenWidth < 480 ? 1.3 : 1.5,
  },
  tableBody: {
    maxHeight: screenHeight * 0.42,
    backgroundColor: '#fff',
  },
modalBodyContent: {
    paddingBottom: 20,
  },
  // Appointment row optimizada con mejor spacing
  appointmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 16,
    paddingHorizontal: 10,
    minHeight: 76,
  },
  appointmentCell: {
    minWidth: screenWidth < 480 ? 75 : 90,
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentText: {
    fontSize: screenWidth > 680 ? 16 : 15,
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  actionsCell: {
    minWidth: screenWidth < 480 ? 130 : 150,
    flex: screenWidth < 480 ? 1.3 : 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsContainer: {
    flexDirection: screenWidth < 480 ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: screenWidth < 480 ? 6 : 8,
  },

  // Botones optimizados para touch con mejor feedback visual
  actionButton: {
    backgroundColor: '#dbeafe',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    minHeight: 40,
    minWidth: screenWidth < 480 ? 90 : 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: screenWidth > 680 ? 14 : 13,
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  deleteButtonText: {
    color: '#dc2626',
  },

  // Filters mejorados con mejor adaptabilidad
  filtersContainer: {
    flexDirection: screenWidth < 640 ? 'column' : 'row',
    alignItems: screenWidth < 640 ? 'stretch' : 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginBottom: 4,
  },
  filterPicker: {
    flex: screenWidth < 640 ? 0 : 1,
    minWidth: screenWidth < 640 ? '100%' : 140,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    height: 52,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  statusPicker: {
    width: screenWidth < 640 ? '100%' : 140,
    marginLeft: screenWidth < 640 ? 0 : 10,
    backgroundColor: '#1680ebff',
    borderRadius: 14,
    overflow: 'hidden',
    height: 52,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  dateFilterButton: {
    backgroundColor: '#dbeafe',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#bfdbfe',
    flex: screenWidth < 640 ? 0 : undefined,
    minWidth: screenWidth < 640 ? '100%' : 120,
  },
  dateFilterText: {
    color: '#2563eb',
    fontWeight: '700',
    fontSize: screenWidth > 680 ? 16 : 15,
  },
  clearFilterButton: {
    backgroundColor: '#fef2f2',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fecaca',
    flex: screenWidth < 640 ? 0 : undefined,
    minWidth: screenWidth < 640 ? '100%' : 120,
  },
  clearFilterText: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: screenWidth > 680 ? 16 : 15,
  },

  // Badge styles mejorados con mejor contraste
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    marginVertical: 4,
    minHeight: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeText: {
    fontWeight: '700',
    fontSize: screenWidth > 680 ? 15 : 14,
  },

  // Estados vacíos y loading mejorados
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    color: '#64748b',
    fontStyle: 'italic',
    fontSize: screenWidth > 680 ? 18 : 16,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    padding: 24,
    color: '#64748b',
    fontStyle: 'italic',
    fontSize: screenWidth > 680 ? 18 : 16,
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: screenWidth > 680 ? 19 : 18,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '600',
  },

  // Modal actions mejorados con mejor UX
  modalActions: {
    flexDirection: screenWidth < 480 ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    marginTop: 24,
    gap: 16,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
    minHeight: 56,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: screenWidth > 680 ? 18 : 17,
  },
  cancelButton: {
    backgroundColor: '#f8fafc',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
    minHeight: 56,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  cancelButtonText: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: screenWidth > 680 ? 18 : 17,
  },

  // Toast mejorado con mejor posicionamiento
  toast: {
    position: 'absolute',
    bottom: screenHeight > 720 ? 40 : 30,
    left: 20,
    right: 20,
    backgroundColor: '#2563eb',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  toastText: {
    color: '#fff',
    fontSize: screenWidth > 768 ? 17 : 16,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Responsive helpers mejorados
  row: {
    flexDirection: screenWidth < 480 ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: screenWidth < 480 ? 'stretch' : 'center',
    marginVertical: 10,
    gap: 10,
  },
  column: {
    flex: 1,
    marginVertical: screenWidth < 480 ? 4 : 0,
  },
  dateInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timePicker: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    marginTop: 6,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  picker: {
    height: 52,
    width: '100%',
  },
  modalStatusPicker: {
    width: '100%',
    marginTop: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    height: 52,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  viewButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: screenWidth < 480 ? 90 : 90,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  viewButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: screenWidth > 680 ? 15 : 14,
  },
  
});