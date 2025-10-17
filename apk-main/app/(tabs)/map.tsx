import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_DEFAULT } from 'react-native-maps';
import { fetchStations, fetchParcelas, fetchZonas, Station, Parcela, Zona } from '@/services/api';

export default function MapScreen() {
  const [stations, setStations] = useState<Station[]>([]);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showParcelas, setShowParcelas] = useState(true);

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    try {
      setLoading(true);
      const [stationsRes, parcelasRes, zonasRes] = await Promise.all([
        fetchStations(),
        fetchParcelas(),
        fetchZonas(),
      ]);

      if (stationsRes.success && stationsRes.data) {
        setStations(stationsRes.data);
      }
      if (parcelasRes.success && parcelasRes.data) {
        setParcelas(parcelasRes.data);
      }
      if (zonasRes.success && zonasRes.data) {
        setZonas(zonasRes.data);
      }
    } catch (err) {
      setError('Error al cargar datos del mapa');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getMarkerColor = (estado: string) => {
    switch (estado) {
      case 'online':
        return '#10b981';
      case 'offline':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const getParcelaColor = (parcela: Parcela): string => {
    const zona = zonas.find(z => z.id === parcela.zona_id);
    return zona?.color || '#3b82f6';
  };

  const hexToRgba = (hex: string, alpha: number = 0.3): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(59, 130, 246, ${alpha})`;

    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const initialRegion = {
    latitude: -13.6333,
    longitude: -72.8833,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {showParcelas && parcelas.map((parcela) => {
          if (!parcela.coordenadas_gps || parcela.coordenadas_gps.length < 3) return null;

          const color = getParcelaColor(parcela);
          const coordinates = parcela.coordenadas_gps.map(coord => ({
            latitude: coord.lat,
            longitude: coord.lng,
          }));

          return (
            <Polygon
              key={`parcela-${parcela.id}`}
              coordinates={coordinates}
              fillColor={hexToRgba(color, 0.3)}
              strokeColor={color}
              strokeWidth={2}
            />
          );
        })}

        {stations.map((station) => (
          <Marker
            key={`station-${station.id}`}
            coordinate={{
              latitude: station.latitud,
              longitude: station.longitud,
            }}
            title={station.nombre}
            description={`Estado: ${station.estado} | Batería: ${station.nivel_bateria}%`}
            pinColor={getMarkerColor(station.estado)}
          />
        ))}
      </MapView>

      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setShowParcelas(!showParcelas)}
      >
        <Text style={styles.toggleButtonText}>
          {showParcelas ? 'Ocultar Parcelas' : 'Mostrar Parcelas'}
        </Text>
      </TouchableOpacity>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Estaciones</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
          <Text style={styles.legendText}>Online</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
          <Text style={styles.legendText}>Advertencia</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.legendText}>Offline</Text>
        </View>
        {showParcelas && parcelas.length > 0 && (
          <>
            <Text style={[styles.legendTitle, { marginTop: 8 }]}>Parcelas</Text>
            <Text style={styles.legendSubtext}>{parcelas.length} parcelas</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  toggleButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxWidth: 200,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  legendSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#374151',
  },
});
