import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, G, Text as SvgText, Rect } from 'react-native-svg';

interface TimeSeriesChartProps {
  data: Array<{ timestamp: number; valor: number }>;
  color: string;
  unit: string;
  compact?: boolean;
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ 
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

  // Ordenar datos por timestamp y usar SOLO datos reales
  const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);

  // Usar el rango REAL de los datos, no forzar ningún período
  const minTime = Math.min(...sortedData.map(d => d.timestamp));
  const maxTime = Math.max(...sortedData.map(d => d.timestamp));
  const timeRange = maxTime - minTime;

  const values = sortedData.map(d => d.valor);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;

  const getX = (timestamp: number) => {
    return padding + ((timestamp - minTime) / timeRange) * (width - 2 * padding);
  };

  const getY = (value: number) => {
    return padding + (height - 2 * padding) - ((value - minValue) / valueRange) * (height - 2 * padding);
  };

  const generateLineSegments = () => {
    const segments = [];
    
    for (let i = 0; i < sortedData.length - 1; i++) {
      const currentPoint = sortedData[i];
      const nextPoint = sortedData[i + 1];
      
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
    if (sortedData.length === 0) return [];
    
    const labels = [];
    const totalLabels = Math.min(4, sortedData.length);
    
    for (let i = 0; i < totalLabels; i++) {
      const index = Math.floor((i / (totalLabels - 1)) * (sortedData.length - 1));
      const point = sortedData[index];
      const date = new Date(point.timestamp);
      
      const totalDays = timeRange / (1000 * 60 * 60 * 24);
      
      let label;
      if (totalDays <= 2) {
        label = `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      } else if (totalDays <= 7) {
        label = `${date.getDate()}/${date.getMonth() + 1}`;
      } else {
        label = `${date.getDate()}/${date.getMonth() + 1}`;
      }
      
      labels.push({
        x: getX(point.timestamp),
        label
      });
    }
    
    return labels;
  };

  const generateYLabels = () => {
    const steps = 2;
    const labels = [];
    
    for (let i = 0; i <= steps; i++) {
      const value = minValue + (valueRange * i) / steps;
      const y = getY(value);
      labels.push({
        y,
        label: value.toFixed(0)
      });
    }
    
    return labels;
  };

  const xLabels = generateXLabels();
  const yLabels = generateYLabels();

  const totalDays = timeRange / (1000 * 60 * 60 * 24);

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
        {sortedData.map((point, index) => (
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
              y={height - padding + 15}
              textAnchor="middle"
              fontSize="8"
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
              fontSize="8"
              fill="#6b7280"
            >
              {label.label}
            </SvgText>
          </G>
        ))}
      </Svg>
      
      {/* Información mínima para tarjeta */}
      <View style={styles.timeRangeInfo}>
        <Text style={styles.dataPointsText}>
          {sortedData.length} puntos • {totalDays.toFixed(0)} días
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
    marginTop: 4,
  },
  dataPointsText: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default TimeSeriesChart;