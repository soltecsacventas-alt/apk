import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, G, Text as SvgText } from 'react-native-svg';

interface RealTimeChartProps {
  data: Array<{ timestamp: number; valor: number }>;
  color: string;
  unit: string;
  compact?: boolean;
}

const RealTimeChart: React.FC<RealTimeChartProps> = ({ 
  data, 
  color, 
  unit,
  compact = false 
}) => {
  const width = Dimensions.get('window').width - (compact ? 80 : 48);
  const height = compact ? 120 : 160;
  const padding = 40;

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.noDataText}>No hay datos históricos</Text>
      </View>
    );
  }

  // Ordenar datos por timestamp para asegurar correcta visualización
  const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);

  // Encontrar el rango de tiempo real
  const minTime = Math.min(...sortedData.map(d => d.timestamp));
  const maxTime = Math.max(...sortedData.map(d => d.timestamp));
  const timeRange = maxTime - minTime;

  // Encontrar el rango de valores
  const values = sortedData.map(d => d.valor);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  // Función para mapear tiempo a coordenada X
  const getX = (timestamp: number) => {
    return padding + ((timestamp - minTime) / timeRange) * (width - 2 * padding);
  };

  // Función para mapear valor a coordenada Y
  const getY = (value: number) => {
    return padding + (height - 2 * padding) - ((value - minValue) / valueRange) * (height - 2 * padding);
  };

  // Generar puntos para la línea
  const points = sortedData
    .map(point => `${getX(point.timestamp)},${getY(point.valor)}`)
    .join(' ');

  // Generar etiquetas para el eje X (fechas)
  const generateXLabels = () => {
    if (sortedData.length === 0) return [];
    
    const labels = [];
    const totalPoints = Math.min(4, sortedData.length); // Máximo 4 etiquetas
    
    for (let i = 0; i < totalPoints; i++) {
      const index = Math.floor((i / (totalPoints - 1)) * (sortedData.length - 1));
      const point = sortedData[index];
      const date = new Date(point.timestamp);
      
      // Formato basado en el rango temporal
      const daysDiff = (maxTime - minTime) / (1000 * 60 * 60 * 24);
      
      let label;
      if (daysDiff <= 1) {
        // Menos de 1 día: mostrar hora
        label = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      } else if (daysDiff <= 7) {
        // Menos de 1 semana: mostrar día y hora
        label = `${date.getDate()}/${date.getMonth() + 1}\n${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      } else {
        // Más de 1 semana: mostrar fecha
        label = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear().toString().slice(2)}`;
      }
      
      labels.push({
        x: getX(point.timestamp),
        label,
        date: point.timestamp
      });
    }
    
    return labels;
  };

  // Generar etiquetas para el eje Y (valores)
  const generateYLabels = () => {
    const steps = 3;
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

  return (
    <View style={[styles.container, { height }]}>
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
        
        {/* Línea del gráfico */}
        <Line
          x1={getX(sortedData[0].timestamp)}
          y1={getY(sortedData[0].valor)}
          x2={getX(sortedData[sortedData.length - 1].timestamp)}
          y2={getY(sortedData[sortedData.length - 1].valor)}
          stroke={color}
          strokeWidth="2"
          strokeDasharray="4,4"
          opacity="0.3"
        />
        
        {/* Línea principal */}
        {sortedData.length > 1 && (
          <Line
            x1={getX(sortedData[0].timestamp)}
            y1={getY(sortedData[0].valor)}
            x2={getX(sortedData[sortedData.length - 1].timestamp)}
            y2={getY(sortedData[sortedData.length - 1].valor)}
            stroke={color}
            strokeWidth="2"
          />
        )}
        
        {/* Puntos de datos */}
        {sortedData.map((point, index) => (
          <G key={index}>
            <Line
              x1={getX(point.timestamp)}
              y1={getY(point.valor) - 4}
              x2={getX(point.timestamp)}
              y2={getY(point.valor) + 4}
              stroke={color}
              strokeWidth="2"
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
              y={label.y + 4}
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
      
      {/* Información del rango temporal */}
      <View style={styles.timeRangeInfo}>
        <Text style={styles.timeRangeText}>
          {new Date(minTime).toLocaleDateString('es-ES')} - {new Date(maxTime).toLocaleDateString('es-ES')}
        </Text>
        <Text style={styles.dataPointsText}>
          {sortedData.length} puntos • {(timeRange / (1000 * 60 * 60 * 24)).toFixed(1)} días
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
  },
  timeRangeInfo: {
    marginTop: 8,
    alignItems: 'center',
  },
  timeRangeText: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
  },
  dataPointsText: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 2,
  },
});

export default RealTimeChart;