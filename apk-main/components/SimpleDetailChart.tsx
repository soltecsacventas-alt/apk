import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Polyline, G, Text as SvgText } from 'react-native-svg';

interface SimpleDetailChartProps {
  data: Array<{ timestamp: number; valor: number }>;
  color: string;
  sensorType: string;
  unit: string;
}

const SimpleDetailChart: React.FC<SimpleDetailChartProps> = ({ 
  data, 
  color, 
  sensorType,
  unit 
}) => {
  const width = Dimensions.get('window').width - 64;
  const height = 300;
  const padding = 40;

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.noDataText}>No hay datos para mostrar</Text>
      </View>
    );
  }

  // Reducir a máximo 30 puntos distribuidos uniformemente
  const getReducedData = () => {
    if (data.length <= 30) return data;
    
    const reducedData = [];
    const step = Math.floor(data.length / 30);
    
    for (let i = 0; i < data.length; i += step) {
      if (reducedData.length < 30) {
        reducedData.push(data[i]);
      }
    }
    
    // Asegurarnos de incluir el último punto
    if (reducedData[reducedData.length - 1] !== data[data.length - 1]) {
      reducedData[reducedData.length - 1] = data[data.length - 1];
    }
    
    return reducedData;
  };

  const reducedData = getReducedData();

  // Calcular valores para el gráfico
  const values = reducedData.map(point => point.valor);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const valueRange = maxValue - minValue || 1;

  // Crear puntos para la polilínea
  const points = reducedData
    .map((point, index) => {
      const x = padding + (index * (width - 2 * padding)) / (reducedData.length - 1 || 1);
      const y = padding + (height - 2 * padding) - ((point.valor - minValue) / valueRange) * (height - 2 * padding);
      return `${x},${y}`;
    })
    .join(' ');

  // Calcular pendientes entre segmentos
  const calculateSlopes = () => {
    const slopes = [];
    for (let i = 1; i < reducedData.length; i++) {
      const prevPoint = reducedData[i - 1];
      const currentPoint = reducedData[i];
      const timeDiff = currentPoint.timestamp - prevPoint.timestamp;
      const valueDiff = currentPoint.valor - prevPoint.valor;
      const slope = valueDiff / (timeDiff / (60 * 60 * 1000)); // Pendiente por hora
      slopes.push({
        slope: slope,
        x: padding + (i * (width - 2 * padding)) / (reducedData.length - 1 || 1) - ((width - 2 * padding) / (reducedData.length - 1 || 1)) / 2,
        y: padding + (height - 2 * padding) - ((currentPoint.valor - minValue) / valueRange) * (height - 2 * padding)
      });
    }
    return slopes;
  };

  const slopes = calculateSlopes();

  // Generar etiquetas para el eje X (fechas/horas)
  const xAxisLabels = reducedData
    .filter((_, index) => index % Math.ceil(reducedData.length / 6) === 0 || index === reducedData.length - 1)
    .map((point, index) => {
      const date = new Date(point.timestamp);
      const x = padding + (reducedData.indexOf(point) * (width - 2 * padding)) / (reducedData.length - 1 || 1);
      
      // Formato de fecha según el rango temporal
      const isSameDay = reducedData.length > 0 && 
        new Date(reducedData[0].timestamp).toDateString() === new Date(reducedData[reducedData.length - 1].timestamp).toDateString();
      
      const label = isSameDay 
        ? `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
        : `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      
      return {
        x,
        label
      };
    });

  // Generar etiquetas para el eje Y (valores)
  const yAxisLabels = [minValue, minValue + valueRange * 0.5, maxValue].map((value, index) => {
    const y = padding + (height - 2 * padding) - (index * (height - 2 * padding) / 2);
    return {
      y,
      label: value.toFixed(1)
    };
  });

  // Determinar color según pendiente
  const getSlopeColor = (slope: number) => {
    if (slope > 0.1) return '#10b981'; // Verde para subida
    if (slope < -0.1) return '#ef4444'; // Rojo para bajada
    return '#6b7280'; // Gris para estable
  };

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {/* Eje Y */}
        <Line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#d1d5db"
          strokeWidth="1"
        />
        
        {/* Eje X */}
        <Line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#d1d5db"
          strokeWidth="1"
        />
        
        {/* Línea del gráfico principal */}
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="3"
        />
        
        {/* Puntos de datos */}
        {reducedData.map((point, index) => {
          const x = padding + (index * (width - 2 * padding)) / (reducedData.length - 1 || 1);
          const y = padding + (height - 2 * padding) - ((point.valor - minValue) / valueRange) * (height - 2 * padding);
          return (
            <Line
              key={index}
              x1={x}
              y1={y - 4}
              x2={x}
              y2={y + 4}
              stroke={color}
              strokeWidth="2"
            />
          );
        })}
        
        {/* Indicadores de pendiente */}
        {slopes.map((slopePoint, index) => (
          <G key={`slope-${index}`}>
            <SvgText
              x={slopePoint.x}
              y={slopePoint.y - 10}
              textAnchor="middle"
              fontSize="8"
              fill={getSlopeColor(slopePoint.slope)}
              fontWeight="bold"
            >
              {slopePoint.slope > 0 ? '↗' : slopePoint.slope < 0 ? '↘' : '→'}
            </SvgText>
            <SvgText
              x={slopePoint.x}
              y={slopePoint.y - 20}
              textAnchor="middle"
              fontSize="6"
              fill={getSlopeColor(slopePoint.slope)}
            >
              {Math.abs(slopePoint.slope).toFixed(2)}/h
            </SvgText>
          </G>
        ))}
        
        {/* Etiquetas del eje X */}
        {xAxisLabels.map((label, index) => (
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
        {yAxisLabels.map((label, index) => (
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
          y={padding - 10}
          textAnchor="end"
          fontSize="12"
          fill="#374151"
          fontWeight="bold"
        >
          {unit}
        </SvgText>

        {/* Leyenda de pendientes */}
        <G>
          <SvgText
            x={width - padding}
            y={padding - 5}
            textAnchor="end"
            fontSize="8"
            fill="#10b981"
          >
            ↗ Subiendo
          </SvgText>
          <SvgText
            x={width - padding}
            y={padding + 5}
            textAnchor="end"
            fontSize="8"
            fill="#ef4444"
          >
            ↘ Bajando
          </SvgText>
          <SvgText
            x={width - padding}
            y={padding + 15}
            textAnchor="end"
            fontSize="8"
            fill="#6b7280"
          >
            → Estable
          </SvgText>
        </G>
      </Svg>

      {/* Información de resumen */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {reducedData.length} puntos muestreados de {data.length} totales
        </Text>
        <Text style={styles.summaryText}>
          Rango: {new Date(reducedData[0].timestamp).toLocaleDateString('es-ES')} - {new Date(reducedData[reducedData.length - 1].timestamp).toLocaleDateString('es-ES')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  noDataText: {
    color: '#6b7280',
    fontSize: 16,
    textAlign: 'center',
  },
  summary: {
    marginTop: 16,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
});

export default SimpleDetailChart;