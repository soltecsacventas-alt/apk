export interface Sensor {
  id: string;
  nombre: string;
  tipo: string;
  ultimo_valor: string;
  unidad: string;
  parcela_id: string;
  estacion_id: string;
  ultima_lectura: string;
  estado: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  timestamp: string;
  status: number;
  data: Sensor[];
  debug?: {
    execution_time: string;
    memory_usage: string;
    query_count: number;
  };
}

// Añade estas interfaces para los datos históricos
export interface HistoricalDataPoint {
  timestamp: number;
  valor: number;
  bateria: number;
  senal: number;
}

export interface HistoricalDataResponse {
  success: boolean;
  message: string;
  data: {
    campo: string;
    parcela_id: string;
    fecha_inicio: string;
    fecha_fin: string;
    total_puntos: number;
    datos: HistoricalDataPoint[];
  };
  timestamp: string;
}