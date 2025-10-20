import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { fetchHistoricalData } from '@/services/api';
import { HistoricalDataPoint } from '@/types/sensor';
import TimeSeriesChart from './TimeSeriesChart';

interface SensorChartProps {
  sensorId: string;
  sensorType: string;
  parcelaId: string;
  visible: boolean;
  compact?: boolean;
}

const SensorChart: React.FC<SensorChartProps> = ({ 
  sensorId, 
  sensorType, 
  parcelaId, 
  visible, 
  compact = false 
}) => {
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && historicalData.length === 0) {
      loadHistoricalData();
    }
  }, [visible]);

  const loadHistoricalData = async () => {
    setLoading(true);
    setError(null);
    try {
      const campo = mapSensorTypeToField(sensorType);
      
      if (!campo) {
        setError('Tipo de sensor no soportado para gráficos');
        return;
      }

      // Pedir un rango amplio para obtener TODOS los datos reales
      const fechaFin = new Date();
      const fechaInicio = new Date('2024-01-01'); // Fecha antigua para capturar todo el historial
      
      const data = await fetchHistoricalData(
        parcelaId, 
        campo, 
        formatDate(fechaInicio), 
        formatDate(fechaFin)
      );
      
      if (data.success && data.data && Array.isArray(data.data.datos)) {
        // Usar SOLO los datos reales, sin filtrar por fecha
        const validData = data.data.datos
          .filter(point => point && point.timestamp && point.valor != null)
          .sort((a, b) => a.timestamp - b.timestamp);
        
        setHistoricalData(validData);

        if (validData.length === 0) {
          setError('No se encontraron datos históricos');
        }
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
    return units[sensorType] || '';
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

  if (!visible) return null;

  if (loading) {
    return (
      <View style={[styles.chartContainer, compact && styles.compactChartContainer]}>
        <ActivityIndicator size="small" color="#2563eb" />
        <Text style={styles.loadingText}>Cargando historial...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.chartContainer, compact && styles.compactChartContainer]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.chartContainer, compact && styles.compactChartContainer]}>
      <Text style={[styles.chartTitle, compact && styles.compactChartTitle]}>
        Historial Real
      </Text>
      
      <TimeSeriesChart
        data={historicalData}
        color={getSensorColor()}
        unit={getUnit()}
        compact={compact}
      />
      
      {historicalData.length > 0 && (
        <View style={styles.dataInfo}>
          <Text style={styles.dataInfoText}>
            Período: {new Date(historicalData[0].timestamp).toLocaleDateString('es-ES')} - {new Date(historicalData[historicalData.length - 1].timestamp).toLocaleDateString('es-ES')}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  compactChartContainer: {
    padding: 8,
    marginTop: 8,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  compactChartTitle: {
    fontSize: 12,
    marginBottom: 6,
  },
  loadingText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    textAlign: 'center',
  },
  dataInfo: {
    marginTop: 8,
  },
  dataInfoText: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default SensorChart;