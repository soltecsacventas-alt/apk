import { ApiResponse, HistoricalDataResponse } from '@/types/sensor';

const API_BASE_URL = 'https://citeapurimac.org/NawapariyProject/api-v3';

export async function fetchSensors(estacionId: number = 1): Promise<ApiResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/sensors?estado=activo&estacion_id=${estacionId}`
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data: ApiResponse = await response.json();
    return data;
  } catch (error) {
    throw new Error(`Error al obtener sensores: ${error}`);
  }
}

// Añade esta función para obtener datos históricos
export async function fetchHistoricalData(
  parcelaId: string,
  campo: string,
  fechaInicio: string,
  fechaFin: string
): Promise<HistoricalDataResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/sensor-data/historical?parcela_id=${parcelaId}&campo=${campo}&fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data: HistoricalDataResponse = await response.json();
    return data;
  } catch (error) {
    throw new Error(`Error al obtener datos históricos: ${error}`);
  }
}
// Añade esta función al archivo api.ts
export async function fetchDataRange(
  parcelaId: string,
  campo: string
): Promise<{min_date: string; max_date: string}> {
  try {
    // Primero intentamos con un rango muy amplio para encontrar los límites reales
    const fechaFin = new Date();
    const fechaInicio = new Date('2020-01-01'); // Fecha muy antigua
    
    const response = await fetch(
      `${API_BASE_URL}/sensor-data/historical?parcela_id=${parcelaId}&campo=${campo}&fecha_inicio=${formatDate(fechaInicio)}&fecha_fin=${formatDate(fechaFin)}`
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.data && Array.isArray(data.data.datos) && data.data.datos.length > 0) {
      const timestamps = data.data.datos.map((d: any) => d.timestamp);
      const minTimestamp = Math.min(...timestamps);
      const maxTimestamp = Math.max(...timestamps);
      
      return {
        min_date: new Date(minTimestamp).toISOString().split('T')[0],
        max_date: new Date(maxTimestamp).toISOString().split('T')[0]
      };
    } else {
      // Si no hay datos, devolvemos fechas por defecto
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() - 30);
      return {
        min_date: formatDate(defaultDate),
        max_date: formatDate(new Date())
      };
    }
  } catch (error) {
    console.error('Error al obtener rango de datos:', error);
    // En caso de error, devolvemos un rango por defecto
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() - 30);
    return {
      min_date: formatDate(defaultDate),
      max_date: formatDate(new Date())
    };
  }
}

// Función auxiliar para formatear fechas
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Función para obtener el último timestamp real de datos
export async function getLastRealDataTimestamp(
  parcelaId: string,
  campo: string
): Promise<number> {
  try {
    const hoy = new Date();
    const hace1Mes = new Date();
    hace1Mes.setMonth(hace1Mes.getMonth() - 1);

    const response = await fetch(
      `${API_BASE_URL}/sensor-data/historical?parcela_id=${parcelaId}&campo=${campo}&fecha_inicio=${formatDate(hace1Mes)}&fecha_fin=${formatDate(hoy)}`
    );

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.data && Array.isArray(data.data.datos) && data.data.datos.length > 0) {
      // Ordenar por timestamp y tomar el más reciente que no sea futuro
      const ahora = Date.now();
      const datosValidos = data.data.datos
        .filter(point => point.timestamp <= ahora)
        .sort((a, b) => b.timestamp - a.timestamp);
      
      return datosValidos.length > 0 ? datosValidos[0].timestamp : 0;
    }
    
    return 0;
  } catch (error) {
    console.error('Error al obtener último timestamp real:', error);
    return 0;
  }
}