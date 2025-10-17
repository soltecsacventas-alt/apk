import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { Line, G, Text as SvgText, Rect } from 'react-native-svg';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

interface AdvancedRealTimeChartProps {
  data: Array<{ timestamp: number; valor: number }>;
  color: string;
  sensorType: string;
  unit: string;
}

const AdvancedRealTimeChart: React.FC<AdvancedRealTimeChartProps> = ({ 
  data, 
  color, 
  sensorType,
  unit 
}) => {
  const width = Dimensions.get('window').width - 64;
  const height = 400;
  const padding = 60;

  const [visibleStart, setVisibleStart] = useState(0);
  const [visibleEnd, setVisibleEnd] = useState(1);

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No hay datos para mostrar</Text>
      </View>
    );
  }

  // Ordenar y procesar datos
  const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
  const minTime = Math.min(...sortedData.map(d => d.timestamp));
  const maxTime = Math.max(...sortedData.map(d => d.timestamp));
  const timeRange = maxTime - minTime;

  // Calcular rango visible
  const visibleTimeRange = timeRange * (visibleEnd - visibleStart);
  const visibleMinTime = minTime + (timeRange * visibleStart);
  const visibleMaxTime = minTime + (timeRange * visibleEnd);

  // Filtrar datos visibles
  const visibleData = sortedData.filter(point => 
    point.timestamp >= visibleMinTime && point.timestamp <= visibleMaxTime
  );

  // Encontrar el rango de valores visibles
  const visibleValues = visibleData.map(d => d.valor);
  const minValue = Math.min(...visibleValues);
  const maxValue = Math.max(...visibleValues);
  const valueRange = maxValue - minValue || 1;

  // Funciones de mapeo
  const getX = (timestamp: number) => {
    return padding + ((timestamp - visibleMinTime) / visibleTimeRange) * (width - 2 * padding);
  };

  const getY = (value: number) => {
    return padding + (height - 2 * padding) - ((value - minValue) / valueRange) * (height - 2 * padding);
  };

  // Generar línea del gráfico
  const points = visibleData
    .map(point => `${getX(point.timestamp)},${getY(point.valor)}`)
    .join(' ');

  // ... (resto del código similar al RealTimeChart pero con controles de zoom)

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gráfico de Datos Reales</Text>
      <Text style={styles.subtitle}>
        {sensorType} • {unit} • {sortedData.length} puntos totales
      </Text>

      <Svg width={width} height={height}>
        {/* Ejes y gráfico principal */}
        {/* Similar al RealTimeChart pero más detallado */}
      </Svg>

      {/* Controles de zoom y navegación */}
      <View style={styles.controls}>
        <Text style={styles.controlLabel}>
          Período visible: {new Date(visibleMinTime).toLocaleDateString('es-ES')} - {new Date(visibleMaxTime).toLocaleDateString('es-ES')}
        </Text>
        {/* Controles de zoom aquí */}
      </View>

      {/* Información detallada */}
      <View style={styles.stats}>
        <Text style={styles.statsTitle}>Estadísticas del Período Visible</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Mínimo</Text>
            <Text style={[styles.statValue, { color }]}>{minValue.toFixed(2)}{unit}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Máximo</Text>
            <Text style={[styles.statValue, { color }]}>{maxValue.toFixed(2)}{unit}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Promedio</Text>
            <Text style={[styles.statValue, { color }]}>
              {(visibleValues.reduce((a, b) => a + b, 0) / visibleValues.length).toFixed(2)}{unit}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  noDataText: {
    color: '#6b7280',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  controls: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  controlLabel: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  stats: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 8,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
});

export default AdvancedRealTimeChart;