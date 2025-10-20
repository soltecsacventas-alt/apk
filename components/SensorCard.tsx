import React, { useState } from 'react';
import { Link } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sensor } from '@/types/sensor';
import {
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  Sun,
  Compass,
  FlaskConical,
  Zap,
  Sprout,
} from 'lucide-react-native';
import SensorChart from './SensorChart';

interface SensorCardProps {
  sensor: Sensor;
}

function getSensorIcon(tipo: string) {
  switch (tipo) {
    case 'temperatura':
    case 'temperatura_suelo':
      return Thermometer;
    case 'humedad':
    case 'suelo':
      return Droplets;
    case 'viento':
      return Wind;
    case 'viento_direccion':
      return Compass;
    case 'lluvia':
      return CloudRain;
    case 'radiacion':
      return Sun;
    case 'ph':
      return FlaskConical;
    case 'conductividad':
      return Zap;
    case 'nutriente':
      return Sprout;
    default:
      return FlaskConical;
  }
}

function getSensorColor(tipo: string): string {
  switch (tipo) {
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
}

export default function SensorCard({ sensor }: SensorCardProps) {
  const [showChart, setShowChart] = useState(false);
  const Icon = getSensorIcon(sensor.tipo);
  const color = getSensorColor(sensor.tipo);

  const toggleChart = () => {
    setShowChart(!showChart);
  };

  // Formatear la fecha de última lectura de manera compacta
  const formatLastReading = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMins < 60) {
      return `Hace ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours} h`;
    } else {
      return date.toLocaleDateString('es-ES', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  return (
    <View style={styles.card}>
      {/* Contenido principal - Área clickeable para el gráfico pequeño */}
      <TouchableOpacity onPress={toggleChart} activeOpacity={0.7}>
        <View style={styles.mainContent}>
          <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
            <Icon size={20} color={color} />
          </View>
          
          <View style={styles.infoContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.sensorName} numberOfLines={1}>{sensor.nombre}</Text>
              <Text style={styles.expandIcon}>{showChart ? '▾' : '▸'}</Text>
            </View>
            
            <View style={styles.detailsRow}>
              <Text style={styles.sensorType}>{sensor.tipo}</Text>
              <Text style={styles.lastReading}>
                {formatLastReading(sensor.ultima_lectura)}
              </Text>
            </View>
            
            <View style={styles.valueRow}>
              <Text style={[styles.sensorValue, { color }]}>
                {sensor.ultimo_valor}
              </Text>
              <Text style={styles.unit}>{sensor.unidad}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Footer con botón para gráfico detallado */}
      <View style={styles.footer}>
        <Link
          href={{
            pathname: "/sensor-chart",
            params: {
              sensorId: sensor.id,
              sensorType: sensor.tipo,
              parcelaId: sensor.parcela_id,
              sensorName: sensor.nombre,
              unidad: sensor.unidad
            }
          }}
          asChild
        >
          <TouchableOpacity style={styles.chartButton}>
            <Text style={styles.chartButtonText}>📊 Gráfico detallado</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* Gráfico pequeño que se expande */}
      {showChart && (
        <SensorChart
          sensorId={sensor.id}
          sensorType={sensor.tipo}
          parcelaId={sensor.parcela_id}
          visible={showChart}
          compact={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  infoContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  sensorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  expandIcon: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sensorType: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  lastReading: {
    fontSize: 11,
    color: '#9ca3af',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  sensorValue: {
    fontSize: 20,
    fontWeight: '700',
    marginRight: 4,
  },
  unit: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  footer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  chartButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chartButtonText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
  },
});