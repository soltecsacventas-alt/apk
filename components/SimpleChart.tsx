import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Polyline, G, Text as SvgText } from 'react-native-svg';

interface SimpleChartProps {
  data: Array<{ timestamp: number; valor: number }>;
  color?: string;
  height?: number;
  compact?: boolean;
  sensorType: string;
}

const SimpleChart: React.FC<SimpleChartProps> = ({ 
  data, 
  color = '#2563eb', 
  height = 160,
  compact = false,
  sensorType
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.noDataText}>No hay datos históricos disponibles</Text>
      </View>
    );
  }

  const width = Dimensions.get('window').width - (compact ? 80 : 48);
  const chartHeight = height - 40;
  const padding = 20;

  // Calcular valores para el gráfico
  const values = data.map(point => point.valor);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const valueRange = maxValue - minValue || 1;

  // Crear puntos para la polilínea
  const points = data
    .map((point, index) => {
      const x = padding + (index * (width - 2 * padding)) / (data.length - 1 || 1);
      const y = padding + chartHeight - ((point.valor - minValue) / valueRange) * chartHeight;
      return `${x},${y}`;
    })
    .join(' ');

  // Formatear fecha para mostrar el rango
  const startDate = new Date(data[0].timestamp).toLocaleDateString('es-ES');
  const endDate = new Date(data[data.length - 1].timestamp).toLocaleDateString('es-ES');

  return (
    <View style={[styles.container, { height }]}>
      <Svg width={width} height={height}>
        {/* Eje Y */}
        <Line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={padding + chartHeight}
          stroke="#d1d5db"
          strokeWidth="1"
        />
        
        {/* Eje X */}
        <Line
          x1={padding}
          y1={padding + chartHeight}
          x2={width - padding}
          y2={padding + chartHeight}
          stroke="#d1d5db"
          strokeWidth="1"
        />
        
        {/* Línea del gráfico */}
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
        
        {/* Etiqueta del último valor */}
        {data.length > 0 && (
          <G>
            <SvgText 
              x={width - padding} 
              y={padding + 10} 
              textAnchor="end" 
              fontSize="10" 
              fill={color}
              fontWeight="bold"
            >
              {data[data.length - 1].valor.toFixed(1)}{getUnit(sensorType)}
            </SvgText>
            <SvgText 
              x={width / 2} 
              y={height - 5} 
              textAnchor="middle" 
              fontSize="10" 
              fill="#6b7280"
            >
              {startDate} - {endDate}
            </SvgText>
          </G>
        )}
      </Svg>
    </View>
  );
};

// Función auxiliar para obtener unidades
const getUnit = (sensorType: string): string => {
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

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default SimpleChart;