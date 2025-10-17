import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
  Modal
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { fetchHistoricalData, fetchDataRange } from '@/services/api';
import SimpleDetailChart from '@/components/SimpleDetailChart';
import AdvancedChart from '@/components/AdvancedChart';
import TimeSeriesChart from '@/components/TimeSeriesChart';
import InteractiveTimeSeriesChart from '@/components/InteractiveTimeSeriesChart';



interface ChartParams {
  sensorId: string;
  sensorType: string;
  parcelaId: string;
  sensorName: string;
  unidad?: string;
}

export default function SensorChartScreen() {
  const params = useLocalSearchParams<ChartParams>();
  const { sensorId, sensorType, parcelaId, sensorName, unidad } = params;

  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRange, setLoadingRange] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para selección de fecha
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [tempStartDate, setTempStartDate] = useState<Date>(new Date());
  const [tempEndDate, setTempEndDate] = useState<Date>(new Date());
  const [showDateModal, setShowDateModal] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');
  
  // Estados para presets de tiempo
  const [timeRange, setTimeRange] = useState<'1d' | '7d' | '30d' | 'custom'>('7d');

  // Estados para información de datos disponibles
  const [dataRange, setDataRange] = useState<{minDate: Date; maxDate: Date}>({
    minDate: new Date(),
    maxDate: new Date()
  });

  // Cargar rango de datos disponibles al inicio
  useEffect(() => {
    loadDataRange();
  }, []);

  // Cargar datos cuando cambien las fechas
  useEffect(() => {
    if (!loadingRange) {
      loadHistoricalData();
    }
  }, [startDate, endDate, loadingRange]);

  const loadDataRange = async () => {
    setLoadingRange(true);
    try {
      const campo = mapSensorTypeToField(sensorType);
      
      if (!campo) {
        setDataRange({
          minDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          maxDate: new Date()
        });
        return;
      }

      const range = await fetchDataRange(parcelaId, campo);
      
      const minDate = new Date(range.min_date);
      const maxDate = new Date(range.max_date);
      
      setDataRange({ minDate, maxDate });
      
      // Establecer fechas por defecto (últimos 7 días)
      const defaultStartDate = new Date(maxDate);
      defaultStartDate.setDate(defaultStartDate.getDate() - 7);
      
      setStartDate(defaultStartDate < minDate ? minDate : defaultStartDate);
      setEndDate(maxDate);
      
    } catch (err) {
      console.error('Error al cargar rango de datos:', err);
      // En caso de error, usar fechas por defecto
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() - 7);
      setDataRange({
        minDate: defaultStartDate,
        maxDate: new Date()
      });
      setStartDate(defaultStartDate);
      setEndDate(new Date());
    } finally {
      setLoadingRange(false);
    }
  };

  const loadHistoricalData = async () => {
    if (loadingRange) return;
    
    setLoading(true);
    setError(null);
    try {
      const campo = mapSensorTypeToField(sensorType);
      
      if (!campo) {
        setError('Tipo de sensor no soportado para gráficos');
        return;
      }

      const data = await fetchHistoricalData(
        parcelaId, 
        campo, 
        formatDate(startDate), 
        formatDate(endDate)
      );
      
      if (data.success && data.data && Array.isArray(data.data.datos)) {
        setHistoricalData(data.data.datos);
      } else {
        setError('No se pudieron cargar los datos históricos');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos históricos');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatDateTimeForDisplay = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

   
  const mapSensorTypeToField = (tipo: string): string | null => {
    const mapping: { [key: string]: string } = {
      'temperatura': 'temp_ambiente',
      'temperatura_suelo': 'temp_suelo',
      'humedad': 'humedad_ambiente',
      'suelo': 'humedad_suelo',
      'viento': 'viento_vel',
      'viento_direccion': 'viento_dir',
      'lluvia': 'lluvia',
      'radiacion': 'radiacion',
      'ph': 'ph',
      'conductividad': 'conductividad',
      'nutriente': 'nitrogeno',
    };
    return mapping[tipo] || null;
  };

  const getUnit = (): string => {
    const units: { [key: string]: string } = {
      'temperatura': '°C',
      'temperatura_suelo': '°C',
      'humedad': '%',
      'suelo': '%',
      'radiacion': 'W/m²',
      'viento': 'm/s',
      'lluvia': 'mm',
      'ph': '',
      'conductividad': 'µS/cm',
    };
    return units[sensorType] || (unidad || '');
  };

  const getSensorColor = (): string => {
    switch (sensorType) {
      case 'temperatura':
      case 'temperatura_suelo':
        return '#ef4444';
      case 'humedad':
      case 'suelo':
        return '#3b82f6';
      case 'viento':
      case 'viento_direccion':
        return '#8b5cf6';
      case 'lluvia':
        return '#06b6d4';
      case 'radiacion':
        return '#f59e0b';
      case 'ph':
        return '#ec4899';
      case 'conductividad':
        return '#eab308';
      case 'nutriente':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  // Presets de tiempo
  const applyTimeRange = (range: '1d' | '7d' | '30d' | 'custom') => {
    const newEndDate = new Date(dataRange.maxDate);
    const newStartDate = new Date(newEndDate);
    
    switch (range) {
      case '1d':
        newStartDate.setDate(newEndDate.getDate() - 1);
        break;
      case '7d':
        newStartDate.setDate(newEndDate.getDate() - 7);
        break;
      case '30d':
        newStartDate.setDate(newEndDate.getDate() - 30);
        break;
      case 'custom':
        setTimeRange('custom');
        // Mostrar modal para selección personalizada
        setTempStartDate(startDate);
        setTempEndDate(endDate);
        setShowDateModal(true);
        return;
    }
    
    // Asegurarse de que no sea menor que la fecha mínima
    if (newStartDate < dataRange.minDate) {
      newStartDate.setTime(dataRange.minDate.getTime());
    }
    
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    setTimeRange(range);
  };

  // Manejar selección de fecha personalizada
  const handleCustomDateConfirm = () => {
    // Validar fechas
    if (tempStartDate > tempEndDate) {
      Alert.alert('Error', 'La fecha de inicio no puede ser mayor que la fecha de fin');
      return;
    }
    
    if (tempStartDate < dataRange.minDate) {
      Alert.alert('Error', `La fecha no puede ser anterior al ${formatDateForDisplay(dataRange.minDate)}`);
      return;
    }
    
    if (tempEndDate > dataRange.maxDate) {
      Alert.alert('Error', `La fecha no puede ser posterior al ${formatDateForDisplay(dataRange.maxDate)}`);
      return;
    }
    
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setShowDateModal(false);
  };

  const handleDateChange = (event: any, selectedDate?: Date, mode?: 'start' | 'end') => {
    if (selectedDate) {
      if (mode === 'start') {
        setTempStartDate(selectedDate);
      } else {
        setTempEndDate(selectedDate);
      }
    }
  };

  // Función para probar diferentes rangos de fecha rápidamente
  const quickDateTest = (days: number) => {
    const end = new Date(dataRange.maxDate);
    const start = new Date(end);
    start.setDate(start.getDate() - days);
    
    // Asegurarse de que no sea menor que la fecha mínima
    if (start < dataRange.minDate) {
      start.setTime(dataRange.minDate.getTime());
    }
    
    setStartDate(start);
    setEndDate(end);
    setTimeRange('custom');
  };

  if (loadingRange) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Cargando...' }} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Cargando información del sensor...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen 
  options={{ 
    title: `Gráfico: ${sensorName}`,
    headerRight: () => (
      <TouchableOpacity 
        onPress={() => router.back()} 
        style={styles.closeButton}
      >
        <Text style={styles.closeText}>← Volver</Text>
      </TouchableOpacity>
    )
  }} 
/>

      <View style={styles.header}>
        <Text style={styles.sensorName}>{sensorName}</Text>
        <Text style={styles.sensorType}>{sensorType} • {getUnit()}</Text>
      </View>

      {/* Información del rango de datos disponibles */}
      <View style={styles.dataRangeInfo}>
        <Text style={styles.dataRangeTitle}>Datos Disponibles del Sensor</Text>
        <Text style={styles.dataRangeText}>
          Desde: {formatDateTimeForDisplay(dataRange.minDate)}
        </Text>
        <Text style={styles.dataRangeText}>
          Hasta: {formatDateTimeForDisplay(dataRange.maxDate)}
        </Text>
        <Text style={styles.dataRangeSubtext}>
          Período total: {Math.ceil((dataRange.maxDate.getTime() - dataRange.minDate.getTime()) / (1000 * 60 * 60 * 24))} días
        </Text>
      </View>

      {/* Selector de rango de tiempo */}
      <View style={styles.timeRangeSelector}>
        <Text style={styles.sectionTitle}>Rango de Tiempo</Text>
        <View style={styles.timeButtons}>
          {(['1d', '7d', '30d', 'custom'] as const).map((range) => (
            <TouchableOpacity
              key={range}
              onPress={() => applyTimeRange(range)}
              style={[
                styles.timeButton,
                timeRange === range && styles.timeButtonActive
              ]}
            >
              <Text style={[
                styles.timeButtonText,
                timeRange === range && styles.timeButtonTextActive
              ]}>
                {range === '1d' ? '1 día' : 
                 range === '7d' ? '7 días' : 
                 range === '30d' ? '30 días' : 'Personalizado'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Botones rápidos para testing */}
        <View style={styles.quickButtons}>
          <Text style={styles.quickButtonsTitle}>Rápidos:</Text>
          {[1, 3, 7, 15, 30, 60, 90].map(days => (
            <TouchableOpacity
              key={days}
              onPress={() => quickDateTest(days)}
              style={styles.quickButton}
            >
              <Text style={styles.quickButtonText}>{days}d</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Información del rango seleccionado */}
      <View style={styles.selectedRangeInfo}>
        <Text style={styles.selectedRangeText}>
          Período seleccionado: {formatDateForDisplay(startDate)} - {formatDateForDisplay(endDate)}
        </Text>
        <Text style={styles.selectedRangeSubtext}>
          ({Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} días) • 
          {' '}{historicalData.length} puntos de datos
        </Text>
      </View>

      {/* Modal para selección de fechas personalizadas */}
      <Modal
        visible={showDateModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Fechas Personalizadas</Text>
            
            <View style={styles.dateInputGroup}>
              <View style={styles.dateInput}>
                <Text style={styles.dateLabel}>Desde:</Text>
                <DateTimePicker
                  value={tempStartDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, date) => handleDateChange(event, date, 'start')}
                  minimumDate={dataRange.minDate}
                  maximumDate={tempEndDate}
                />
                <Text style={styles.dateDisplay}>
                  {formatDateForDisplay(tempStartDate)}
                </Text>
              </View>

              <View style={styles.dateInput}>
                <Text style={styles.dateLabel}>Hasta:</Text>
                <DateTimePicker
                  value={tempEndDate}
                  mode="date"
                  display="spinner"
                  onChange={(event, date) => handleDateChange(event, date, 'end')}
                  minimumDate={tempStartDate}
                  maximumDate={dataRange.maxDate}
                />
                <Text style={styles.dateDisplay}>
                  {formatDateForDisplay(tempEndDate)}
                </Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleCustomDateConfirm}
              >
                <Text style={styles.confirmButtonText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {loading ? (
  <View style={styles.centerContainer}>
    <ActivityIndicator size="large" color="#2563eb" />
    <Text style={styles.loadingText}>Cargando datos históricos...</Text>
  </View>
) : error ? (
  <View style={styles.errorContainer}>
    <Text style={styles.errorText}>{error}</Text>
    <TouchableOpacity style={styles.retryButton} onPress={loadHistoricalData}>
      <Text style={styles.retryButtonText}>Reintentar</Text>
    </TouchableOpacity>
  </View>
) : historicalData.length === 0 ? (
  <View style={styles.noDataContainer}>
    <Text style={styles.noDataText}>No hay datos históricos disponibles</Text>
    <Text style={styles.noDataSubtext}>
      Para el rango seleccionado: {formatDateForDisplay(startDate)} - {formatDateForDisplay(endDate)}
    </Text>
    <TouchableOpacity 
      style={styles.tryDifferentButton}
      onPress={() => quickDateTest(7)}
    >
      <Text style={styles.tryDifferentText}>Probar últimos 7 días</Text>
    </TouchableOpacity>
  </View>
) : (
  <View style={styles.chartContainer}>
    <Text style={styles.chartTitle}>
      Gráfico Interactivo - {historicalData.length} puntos
    </Text>
    
    <InteractiveTimeSeriesChart
  data={historicalData}
  color={getSensorColor()}
  sensorType={sensorType}
  unit={getUnit()}
/>

    {/* Estadísticas */}
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>Máximo</Text>
        <Text style={[styles.statValue, { color: getSensorColor() }]}>
          {Math.max(...historicalData.map(p => p.valor)).toFixed(2)}{getUnit()}
        </Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>Mínimo</Text>
        <Text style={[styles.statValue, { color: getSensorColor() }]}>
          {Math.min(...historicalData.map(p => p.valor)).toFixed(2)}{getUnit()}
        </Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>Promedio</Text>
        <Text style={[styles.statValue, { color: getSensorColor() }]}>
          {(historicalData.reduce((sum, p) => sum + p.valor, 0) / historicalData.length).toFixed(2)}{getUnit()}
        </Text>
      </View>
    </View>
  </View>
)}
      <View style={styles.footer}>
  <TouchableOpacity 
    style={styles.backButton}
    onPress={() => router.back()}
  >
    <Text style={styles.backButtonText}>← Volver al Listado de Sensores</Text>
  </TouchableOpacity>
</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sensorName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  sensorType: {
    fontSize: 16,
    color: '#6b7280',
  },
  dataRangeInfo: {
    backgroundColor: '#e0f2fe',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  dataRangeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 8,
  },
  dataRangeText: {
    fontSize: 12,
    color: '#0c4a6e',
    marginBottom: 2,
  },
  dataRangeSubtext: {
    fontSize: 11,
    color: '#0c4a6e',
    fontStyle: 'italic',
    marginTop: 4,
  },
  timeRangeSelector: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  timeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  timeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  timeButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  timeButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  timeButtonTextActive: {
    color: '#ffffff',
  },
  quickButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickButtonsTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginRight: 8,
  },
  quickButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  quickButtonText: {
    fontSize: 12,
    color: '#374151',
  },
  selectedRangeInfo: {
    backgroundColor: '#ffffff',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedRangeText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedRangeSubtext: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  dateInputGroup: {
    marginBottom: 20,
  },
  dateInput: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 8,
  },
  dateDisplay: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  confirmButton: {
    backgroundColor: '#2563eb',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  noDataContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 16,
  },
  tryDifferentButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  tryDifferentText: {
    color: '#374151',
    fontWeight: '500',
  },
  closeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  closeText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '500',
  },
  // Añade al final del StyleSheet:
footer: {
  padding: 20,
  backgroundColor: '#ffffff',
  borderTopWidth: 1,
  borderTopColor: '#e5e7eb',
  marginTop: 16,
},
backButton: {
  backgroundColor: '#2563eb',
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 8,
  alignItems: 'center',
},
backButtonText: {
  color: '#ffffff',
  fontSize: 16,
  fontWeight: '600',
},
closeButton: {
  paddingHorizontal: 12,
  paddingVertical: 6,
  backgroundColor: '#f3f4f6',
  borderRadius: 6,
  marginRight: 8,
},
closeText: {
  color: '#374151',
  fontSize: 16,
  fontWeight: '500',
},
});