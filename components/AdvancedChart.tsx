import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { GestureHandlerRootView, PanGestureHandler, PinchGestureHandler, State } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

interface AdvancedChartProps {
  data: Array<{ timestamp: number; valor: number }>;
  color: string;
  sensorType: string;
  unit: string;
}

const AdvancedChart: React.FC<AdvancedChartProps> = ({ 
  data, 
  color, 
  sensorType,
  unit 
}) => {
  const screenWidth = Dimensions.get('window').width - 32;
  const [zoomLevel, setZoomLevel] = useState(1);
  const [offset, setOffset] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: data.length - 1 });

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No hay datos para mostrar</Text>
      </View>
    );
  }

  // Calcular el rango visible basado en zoom y desplazamiento
  const calculateVisibleRange = useCallback((scale: number, translation: number) => {
    const totalPoints = data.length;
    const visiblePoints = Math.max(1, Math.floor(totalPoints / scale)); // Mínimo 1 punto
    const maxOffset = Math.max(0, totalPoints - visiblePoints);
    
    let start = Math.max(0, Math.min(maxOffset, Math.floor(-translation / (screenWidth / totalPoints))));
    let end = Math.min(totalPoints - 1, start + visiblePoints - 1);
    
    return { start, end };
  }, [data.length, screenWidth]);

  // Datos visibles actuales
  const visibleData = data.slice(visibleRange.start, visibleRange.end + 1);
  
  // Preparar etiquetas para el eje X
  const getXAxisLabels = () => {
    if (visibleData.length === 0) return [];
    
    const labels = [];
    const step = Math.max(1, Math.floor(visibleData.length / 4)); // Máximo 5 etiquetas
    
    for (let i = 0; i < visibleData.length; i += step) {
      const point = visibleData[i];
      const date = new Date(point.timestamp);
      labels.push(`${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`);
    }
    
    // Asegurarse de incluir el último punto
    if (visibleData.length > 0 && (labels.length === 0 || 
        labels[labels.length - 1] !== `${new Date(visibleData[visibleData.length - 1].timestamp).getDate()}/${new Date(visibleData[visibleData.length - 1].timestamp).getMonth() + 1} ${new Date(visibleData[visibleData.length - 1].timestamp).getHours()}:${new Date(visibleData[visibleData.length - 1].timestamp).getMinutes().toString().padStart(2, '0')}`)) {
      const lastPoint = visibleData[visibleData.length - 1];
      const date = new Date(lastPoint.timestamp);
      labels.push(`${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`);
    }
    
    return labels;
  };

  const visibleChartData = {
    labels: getXAxisLabels(),
    datasets: [
      {
        data: visibleData.map(point => point.valor),
        color: () => color,
        strokeWidth: 3,
      },
    ],
  };

  const pinchRef = useRef();
  const panRef = useRef();

  const onPinchEvent = useCallback((event) => {
    const newScale = Math.max(1, Math.min(data.length, event.nativeEvent.scale * zoomLevel));
    setZoomLevel(newScale);
    
    const newVisibleRange = calculateVisibleRange(newScale, offset);
    setVisibleRange(newVisibleRange);
  }, [zoomLevel, offset, calculateVisibleRange, data.length]);

  const onPanEvent = useCallback((event) => {
    const totalPoints = data.length;
    const maxOffset = Math.max(0, totalPoints - Math.floor(totalPoints / zoomLevel));
    const newOffset = Math.max(-maxOffset, Math.min(0, event.nativeEvent.translationX + offset));
    setOffset(newOffset);
    
    const newVisibleRange = calculateVisibleRange(zoomLevel, newOffset);
    setVisibleRange(newVisibleRange);
  }, [offset, zoomLevel, calculateVisibleRange, data.length]);

  const resetZoom = () => {
    setZoomLevel(1);
    setOffset(0);
    setVisibleRange({ start: 0, end: data.length - 1 });
  };

  const zoomIn = () => {
    const newZoom = Math.min(data.length, zoomLevel * 1.5);
    setZoomLevel(newZoom);
    const newVisibleRange = calculateVisibleRange(newZoom, offset);
    setVisibleRange(newVisibleRange);
  };

  const zoomOut = () => {
    const newZoom = Math.max(1, zoomLevel / 1.5);
    setZoomLevel(newZoom);
    const newVisibleRange = calculateVisibleRange(newZoom, offset);
    setVisibleRange(newVisibleRange);
  };

  const navigateLeft = () => {
    const totalPoints = data.length;
    const maxOffset = Math.max(0, totalPoints - Math.floor(totalPoints / zoomLevel));
    const newOffset = Math.max(-maxOffset, offset - (screenWidth * 0.2));
    setOffset(newOffset);
    
    const newVisibleRange = calculateVisibleRange(zoomLevel, newOffset);
    setVisibleRange(newVisibleRange);
  };

  const navigateRight = () => {
    const totalPoints = data.length;
    const maxOffset = Math.max(0, totalPoints - Math.floor(totalPoints / zoomLevel));
    const newOffset = Math.min(0, offset + (screenWidth * 0.2));
    setOffset(newOffset);
    
    const newVisibleRange = calculateVisibleRange(zoomLevel, newOffset);
    setVisibleRange(newVisibleRange);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>Gráfico Interactivo</Text>
        <Text style={styles.zoomInfo}>
          Zoom: {zoomLevel.toFixed(1)}x • {visibleData.length}/{data.length} puntos
        </Text>
      </View>

      <PinchGestureHandler
        ref={pinchRef}
        onGestureEvent={onPinchEvent}
        onHandlerStateChange={(event) => {
          if (event.nativeEvent.state === State.END) {
            // Lógica adicional si es necesario
          }
        }}
      >
        <Animated.View>
          <PanGestureHandler
            ref={panRef}
            onGestureEvent={onPanEvent}
            onHandlerStateChange={(event) => {
              if (event.nativeEvent.state === State.END) {
                // Lógica adicional si es necesario
              }
            }}
          >
            <Animated.View style={styles.chartContainer}>
              <LineChart
                data={visibleChartData}
                width={screenWidth}
                height={300}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 2,
                  color: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: color,
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: '',
                    stroke: '#e5e7eb',
                    strokeWidth: 1,
                  },
                  // Ajustes para que la gráfica comience desde el margen izquierdo
                  propsForLabels: {
                    dx: -5,
                  },
                }}
                bezier
                style={styles.chart}
                withVerticalLines={true}
                withHorizontalLines={true}
                withHorizontalLabels={true}
                withVerticalLabels={true}
                fromZero={false}
                // Configuración para que la gráfica ocupe todo el ancho
                withShadow={false}
                segments={5}
              />
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </PinchGestureHandler>

      {/* Controles de zoom y navegación */}
      <View style={styles.controls}>
        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Controles de Zoom</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.controlButton} onPress={zoomOut}>
              <Text style={styles.buttonText}>➖ Alejar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={resetZoom}>
              <Text style={styles.buttonText}>🔄 Reiniciar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={zoomIn}>
              <Text style={styles.buttonText}>➕ Acercar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.controlGroup}>
          <Text style={styles.controlLabel}>Navegación</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.controlButton} onPress={navigateLeft}>
              <Text style={styles.buttonText}>◀️ Izquierda</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={navigateRight}>
              <Text style={styles.buttonText}>▶️ Derecha</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Barra de navegación visual */}
        <View style={styles.navigation}>
          <View style={styles.navBar}>
            <View 
              style={[
                styles.navThumb,
                { 
                  width: `${(visibleData.length / data.length) * 100}%`,
                  left: `${(visibleRange.start / data.length) * 100}%`
                }
              ]} 
            />
          </View>
        </View>

        {/* Información del rango visible */}
        <View style={styles.rangeInfo}>
          <Text style={styles.rangeText}>
            Mostrando {visibleData.length} de {data.length} puntos
          </Text>
          {visibleData.length > 0 && (
            <Text style={styles.rangeText}>
              {new Date(visibleData[0].timestamp).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })} - {new Date(visibleData[visibleData.length - 1].timestamp).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          )}
        </View>
      </View>

      {/* Instrucciones */}
      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>Instrucciones:</Text>
        <Text style={styles.instructionText}>• Usa dos dedos para hacer zoom</Text>
        <Text style={styles.instructionText}>• Desliza con un dedo para navegar</Text>
        <Text style={styles.instructionText}>• Usa los botones para control preciso</Text>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  zoomInfo: {
    fontSize: 12,
    color: '#6b7280',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
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
    marginTop: 8,
  },
  rangeText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  instructions: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 12,
    color: '#0369a1',
    marginBottom: 4,
  },
});

export default AdvancedChart;