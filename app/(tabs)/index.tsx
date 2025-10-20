import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  TextInput,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { fetchSensors } from '@/services/api';
import { Sensor } from '@/types/sensor';
import SensorCard from '@/components/SensorCard';

type StationSensors = {
  stationId: number;
  sensors: Sensor[];
};

export default function HomeScreen() {
  const [stations, setStations] = useState<StationSensors[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [query, setQuery] = useState('');

  // Fetching config
  const MAX_STATIONS = 100; // to avoid infinite loops
  const BATCH_SIZE = 5; // cuantos ids pedir por batch (para performance)

  // Carga estaciones en batches: 1,2,3... y corta cuando encuentra el primer id vacío
  const loadStations = async () => {
    setLoading(true);
    setError(null);
    setStations([]);
    setExpanded({});

    try {
      const found: StationSensors[] = [];
      let id = 1;
      let stop = false;

      while (!stop && id <= MAX_STATIONS) {
        // construir lote de ids
        const batchIds: number[] = [];
        for (let i = 0; i < BATCH_SIZE && id + i <= MAX_STATIONS; i++) {
          batchIds.push(id + i);
        }

        // pedir el batch en paralelo
        const promises = batchIds.map((bid) => fetchSensors(bid));
        const responses = await Promise.all(promises);

        for (let i = 0; i < responses.length; i++) {
          const res = responses[i];
          const currentId = batchIds[i];

          if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
            found.push({ stationId: currentId, sensors: res.data });
            // keep going
          } else if (res && res.success && Array.isArray(res.data) && res.data.length === 0) {
            // condición solicitada: "si no devuelve nada desde cierto numero que ya no pida"
            stop = true;
            break;
          } else if (res && !res.success) {
            // si el backend devolvió success:false, registramos y paramos
            setError(`Error en API al consultar estación ${currentId}`);
            stop = true;
            break;
          } else {
            // formato inesperado -> paramos por seguridad
            stop = true;
            break;
          }
        }

        id += batchIds.length;
      }

      if (found.length === 0) {
        setError('No se encontraron sensores en las estaciones consultadas.');
      } else {
        setStations(found);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStations();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadStations();
  };

  // UI helpers
  const toggleExpand = (stationId: number) => {
    setExpanded((prev) => ({ ...prev, [stationId]: !prev[stationId] }));
  };

  const expandAll = () => {
    const map: Record<number, boolean> = {};
    stations.forEach((s) => (map[s.stationId] = true));
    setExpanded(map);
  };

  const collapseAll = () => setExpanded({});

  const totalSensors = useMemo(() => stations.reduce((acc, s) => acc + s.sensors.length, 0), [stations]);

  // Filtrado por query: intenta buscar por nombre de sensor, id o tipo
  const filteredStations = useMemo(() => {
    if (!query.trim()) return stations;
    const q = query.trim().toLowerCase();
    return stations
      .map((st) => ({
        ...st,
        sensors: st.sensors.filter((sen) => {
          const text = JSON.stringify(sen).toLowerCase();
          return text.includes(q);
        }),
      }))
      .filter((st) => st.sensors.length > 0);
  }, [stations, query]);

  // layout for grid: compute columns based on screen width
  const screenWidth = Dimensions.get('window').width;
  const GRID_COLS = screenWidth > 900 ? 3 : screenWidth > 600 ? 2 : 1; // adaptativo

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Cargando sensores...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadStations}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.stationTitle}>Estaciones de Monitoreo</Text>
          <Text style={styles.sensorCount}>{totalSensors} sensores activos — {stations.length} estaciones</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={expandAll} style={styles.headerActionBtn}>
            <Text style={styles.headerActionText}>Expandir todo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={collapseAll} style={styles.headerActionBtn}>
            <Text style={styles.headerActionText}>Colapsar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.controls}>
        <TextInput
          placeholder="Buscar sensores (id, nombre, tipo...)"
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
        />
        {/* ELIMINAMOS EL VIEW TOGGLE COMPLETAMENTE */}
      </View>

      <View style={styles.sensorList}>
        {filteredStations.length === 0 ? (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>No se encontraron sensores que coincidan con la búsqueda.</Text>
          </View>
        ) : (
          filteredStations.map((station) => (
            <View key={station.stationId} style={styles.stationBlock}>
              <TouchableOpacity onPress={() => toggleExpand(station.stationId)} style={styles.stationHeader}>
                <View>
                  <Text style={styles.stationSubTitle}>Estación #{station.stationId}</Text>
                  <Text style={styles.stationMeta}>{station.sensors.length} sensores</Text>
                </View>
                <Text style={styles.expandText}>{expanded[station.stationId] ? '▾' : '▸'}</Text>
              </TouchableOpacity>

              {expanded[station.stationId] && (
                <View style={styles.sensorsContainer}>
                  {/* SIEMPRE MOSTRAMOS EN MODO LISTA */}
                  <FlatList
                    data={station.sensors}
                    keyExtractor={(s) => String(s.id)}
                    renderItem={({ item }) => <SensorCard sensor={item} />}
                    nestedScrollEnabled
                    // performance
                    initialNumToRender={8}
                    removeClippedSubviews
                    scrollEnabled={false} // Mejor rendimiento cuando está anidado
                  />
                </View>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6b7280' },
  errorText: { fontSize: 16, color: '#ef4444', textAlign: 'center', marginBottom: 12 },
  retryBtn: { marginTop: 8, backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  retryText: { color: '#fff', fontWeight: '600' },

  header: { backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', flexDirection: 'row', alignItems: 'center' },
  stationTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  sensorCount: { fontSize: 14, color: '#6b7280' },
  headerActions: { marginLeft: 12, flexDirection: 'row' },
  headerActionBtn: { marginLeft: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#f3f4f6', borderRadius: 6 },
  headerActionText: { fontSize: 12, color: '#374151' },

  controls: { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  searchInput: { backgroundColor: '#f9fafb', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 8 },
  viewToggle: { flexDirection: 'row', alignSelf: 'flex-end' },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginLeft: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  toggleBtnActive: { backgroundColor: '#2563eb' },
  toggleText: { color: '#374151', fontWeight: '600' },
  toggleTextActive: { color: '#fff' },

  sensorList: { padding: 16 },
  stationBlock: { marginBottom: 18, backgroundColor: '#fff', padding: 0, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb' },
  stationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  stationSubTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  stationMeta: { fontSize: 12, color: '#6b7280' },
  expandText: { fontSize: 20, color: '#6b7280' },
  sensorsContainer: { paddingHorizontal: 12, paddingBottom: 12 },

  gridItem: { padding: 8 },

  noResults: { padding: 20, alignItems: 'center' },
  noResultsText: { color: '#6b7280' },
});
