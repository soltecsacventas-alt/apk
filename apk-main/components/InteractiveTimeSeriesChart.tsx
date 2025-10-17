import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { Line, G, Text as SvgText, Rect } from 'react-native-svg';

interface InteractiveTimeSeriesChartProps {
  data: Array<{ timestamp: number; valor: number }>;
  color: string;
  sensorType: string;
  unit: string;
}

const InteractiveTimeSeriesChart: React.FC<InteractiveTimeSeriesChartProps> = ({ 
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

  // Ordenar datos por timestamp - usar SOLO datos reales
  const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);

  // Rango TOTAL real de los datos
  const minTime = Math.min(...sortedData.map(d => d.timestamp));
  const maxTime = Math.max(...sortedData.map(d => d.timestamp));
  const timeRange = maxTime - minTime;

  // Calcular rango visible basado en controles
  const visibleMinTime = minTime + (timeRange * visibleStart);
  const visibleMaxTime = minTime + (timeRange * visibleEnd);
  const visibleTimeRange = visibleMaxTime - visibleMinTime;

  // Filtrar datos visibles
  const visibleData = sortedData.filter(point => 
    point.timestamp >= visibleMinTime && point.timestamp <= visibleMaxTime
  );

  // Calcular valores para el rango visible
  const visibleValues = visibleData.map(d => d.valor);
  const minValue = Math.min(...visibleValues);
  const maxValue = Math.max(...visibleValues);
  const valueRange = maxValue - minValue || 1;

  const getX = (timestamp: number) => {
    return padding + ((timestamp - visibleMinTime) / visibleTimeRange) * (width - 2 * padding);
  };

  const getY = (value: number) => {
    return padding + (height - 2 * padding) - ((value - minValue) / valueRange) * (height - 2 * padding);
  };

  const generateLineSegments = () => {
    const segments = [];
    
    for (let i = 0; i < visibleData.length - 1; i++) {
      const currentPoint = visibleData[i];
      const nextPoint = visibleData[i + 1];
      
      segments.push({
        x1: getX(currentPoint.timestamp),
        y1: getY(currentPoint.valor),
        x2: getX(nextPoint.timestamp),
        y2: getY(nextPoint.valor),
        timeGap: nextPoint.timestamp - currentPoint.timestamp
      });
    }
    
    return segments;
  };

  const lineSegments = generateLineSegments();

  const generateXLabels = () => {
    if (visibleData.length === 0) return [];
    
    const labels = [];
    const totalLabels = Math.min(6, visibleData.length);
    
    for (let i = 0; i < totalLabels; i++) {
      const index = Math.floor((i / (totalLabels - 1)) * (visibleData.length - 1));
      const point = visibleData[index];
      const date = new Date(point.timestamp);
      
      labels.push({
        x: getX(point.timestamp),
        label: `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`,
        fullDate: date.toLocaleDateString('es-ES')
      });
    }
    
    return labels;
  };

  const generateYLabels = () => {
    const steps = 4;
    const labels = [];
    
    for (let i = 0; i <= steps; i++) {
      const value = minValue + (valueRange * i) / steps;
      const y = getY(value);
      labels.push({
        y,
        label: value.toFixed(1)
      });
    }
    
    return labels;
  };

  const xLabels = generateXLabels();
  const yLabels = generateYLabels();

  // Controles de zoom
  const zoomIn = () => {
    const currentRange = visibleEnd - visibleStart;
    const newRange = Math.max(0.01, currentRange * 0.7);
    const center = (visibleStart + visibleEnd) / 2;
    const newStart = Math.max(0, center - newRange / 2);
    const newEnd = Math.min(1, center + newRange / 2);
    setVisibleStart(newStart);
    setVisibleEnd(newEnd);
  };

  const zoomOut = () => {
    const currentRange = visibleEnd - visibleStart;
    const newRange = Math.min(1, currentRange * 1.3);
    const center = (visibleStart + visibleEnd) / 2;
    const newStart = Math.max(0, center - newRange / 2);
    const newEnd = Math.min(1, center + newRange / 2);
    setVisibleStart(newStart);
    setVisibleEnd(newEnd);
  };

  const resetZoom = () => {
    setVisibleStart(0);
    setVisibleEnd(1);
  };

  const navigateLeft = () => {
    const currentRange = visibleEnd - visibleStart;
    const shift = currentRange * 0.3;
    const newStart = Math.max(0, visibleStart - shift);
    const newEnd = Math.min(1, visibleEnd - shift);
    setVisibleStart(newStart);
    setVisibleEnd(newEnd);
  };

  const navigateRight = () => {
    const currentRange = visibleEnd - visibleStart;
    const shift = currentRange * 0.3;
    const newStart = Math.max(0, visibleStart + shift);
    const newEnd = Math.min(1, visibleEnd + shift);
    setVisibleStart(newStart);
    setVisibleEnd(newEnd);
  };

  // Estadísticas
  const stats = {
    min: Math.min(...visibleValues),
    max: Math.max(...visibleValues),
    avg: visibleValues.reduce((a, b) => a + b, 0) / visibleValues.length,
    points: visibleData.length
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gráfico Interactivo - {sensorType}</Text>
      
      <Svg width={width} height={height}>
        {/* Ejes */}
        <Line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#d1d5db"
          strokeWidth="1"
        />
        <Line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#d1d5db"
          strokeWidth="1"
        />
        
        {/* Líneas de segmentos */}
        {lineSegments.map((segment, index) => (
          <Line
            key={index}
            x1={segment.x1}
            y1={segment.y1}
            x2={segment.x2}
            y2={segment.y2}
            stroke={color}
            strokeWidth={segment.timeGap > 24 * 60 * 60 * 1000 ? "1" : "2"}
            strokeDasharray={segment.timeGap > 24 * 60 * 60 * 1000 ? "4,4" : "0"}
            opacity={segment.timeGap > 24 * 60 * 60 * 1000 ? 0.5 : 1}
          />
        ))}
        
        {/* Puntos de datos */}
        {visibleData.map((point, index) => (
          <G key={index}>
            <Rect
              x={getX(point.timestamp) - 2}
              y={getY(point.valor) - 2}
              width="4"
              height="4"
              fill={color}
              opacity="0.8"
            />
          </G>
        ))}
        
        {/* Etiquetas del eje X */}
        {xLabels.map((label, index) => (
          <G key={index}>
            <Line
              x1={label.x}
              y1={height - padding}
              x2={label.x}
              y2={height - padding + 5}
              stroke="#d1d5db"
              strokeWidth="1"
            />
            <SvgText
              x={label.x}
              y={height - padding + 20}
              textAnchor="middle"
              fontSize="10"
              fill="#6b7280"
            >
              {label.label}
            </SvgText>
          </G>
        ))}
        
        {/* Etiquetas del eje Y */}
        {yLabels.map((label, index) => (
          <G key={index}>
            <Line
              x1={padding - 5}
              y1={label.y}
              x2={padding}
              y2={label.y}
              stroke="#d1d5db"
              strokeWidth="1"
            />
            <SvgText
              x={padding - 8}
              y={label.y + 3}
              textAnchor="end"
              fontSize="10"
              fill="#6b7280"
            >
              {label.label}
            </SvgText>
          </G>
        ))}
        
        {/* Etiqueta de unidad */}
        <SvgText
          x={padding - 8}
          y={padding - 5}
          textAnchor="end"
          fontSize="12"
          fill="#374151"
          fontWeight="bold"
        >
          {unit}
        </SvgText>
      </Svg>

      {/* Controles de zoom y navegación */}
      <View style={styles.controls}>
        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Zoom:</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.controlButton} onPress={zoomOut}>
              <Text style={styles.buttonText}>➖ Alejar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={resetZoom}>
              <Text style={styles.buttonText}>🔄 Total</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={zoomIn}>
              <Text style={styles.buttonText}>➕ Acercar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Navegación:</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.controlButton} onPress={navigateLeft}>
              <Text style={styles.buttonText}>◀️ Anterior</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={navigateRight}>
              <Text style={styles.buttonText}>▶️ Siguiente</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Barra de navegación */}
        <View style={styles.navigation}>
          <View style={styles.navBar}>
            <View 
              style={[
                styles.navThumb,
                { 
                  width: `${(visibleEnd - visibleStart) * 100}%`,
                  left: `${visibleStart * 100}%`
                }
              ]} 
            />
          </View>
        </View>
      </View>

      {/* Información del rango visible */}
      <View style={styles.rangeInfo}>
        <Text style={styles.rangeText}>
          {new Date(visibleMinTime).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })} - {new Date(visibleMaxTime).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
        <Text style={styles.rangeSubtext}>
          {visibleData.length} de {sortedData.length} puntos visibles
        </Text>
      </View>

      {/* Estadísticas */}
      <View style={styles.stats}>
        <Text style={styles.statsTitle}>Estadísticas del período visible</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Mínimo</Text>
            <Text style={[styles.statValue, { color }]}>{stats.min.toFixed(1)}{unit}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Máximo</Text>
            <Text style={[styles.statValue, { color }]}>{stats.max.toFixed(1)}{unit}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Promedio</Text>
            <Text style={[styles.statValue, { color }]}>{stats.avg.toFixed(1)}{unit}</Text>
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
    marginBottom: 16,
  },
  controls: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  controlGroup: {
    marginBottom: 16,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  controlButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  buttonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  navigation: {
    marginVertical: 12,
  },
  navBar: {
    height: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  navThumb: {
    position: 'absolute',
    height: 20,
    backgroundColor: '#2563eb',
    borderRadius: 10,
  },
  rangeInfo: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  rangeText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
  rangeSubtext: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  stats: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 12,
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

export default InteractiveTimeSeriesChart;