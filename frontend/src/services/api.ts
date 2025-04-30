import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Plant {
  id: string;
  name: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

// Adicionando interface para AreaNeighbor
export interface AreaNeighbor {
  areaId: string;
  neighborId: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
  area?: Area;
  neighbor?: Area;
}

export interface Area {
  getNeighborCount: any;
  id: string;
  name: string;
  locationDescription: string;
  plantId: string;
  plant?: Plant;
  createdAt: string;
  updatedAt: string;
  // Adicionando campos para as novas relações
  neighborRelations?: AreaNeighbor[];
  neighboredByRelations?: AreaNeighbor[];
  equipmentRelations?: EquipmentArea[];
}

// Adicionando interface para EquipmentArea
export interface EquipmentArea {
  equipmentId: string;
  areaId: string;
  isPrimary: boolean;
  assignedSince?: string;
  createdAt: string;
  createdBy?: string;
  notes?: string;
  equipment?: Equipment;
  area?: Area;
}

export interface Equipment {
  id: string;
  name: string;
  manufacturer: string;
  serialNumber: string;
  initialOperationsDate: string;
  areaId: string;
  area?: Area;
  createdAt: string;
  updatedAt: string;
  // Adicionando campo para as novas relações
  areaRelations?: EquipmentArea[];
}

export enum PartType {
  ELECTRIC = "electric",
  ELECTRONIC = "electronic",
  MECHANICAL = "mechanical",
  HYDRAULICAL = "hydraulical"
}

export interface Part {
  id: string;
  name: string;
  type: PartType;
  manufacturer: string;
  serialNumber: string;
  installationDate: string;
  equipmentId: string;
  equipment?: Equipment;
  createdAt: string;
  updatedAt: string;
}

// Interface para adicionar vizinho
export interface AddNeighborRequest {
  neighborId: string;
  connectionType?: string;
  notes?: string;
}

// Interface para atribuir áreas a equipamentos
export interface AssignAreasRequest {
  areaIds: string[];
  primaryAreaId?: string;
}

export const plantApi = {
  getAll: () => api.get<Plant[]>('/plants'),
  getById: (id: string) => api.get<Plant>(`/plants/${id}`),
  create: (data: Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>) => api.post<Plant>('/plants', data),
  update: (id: string, data: Partial<Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>>) =>
    api.put<Plant>(`/plants/${id}`, data),
  delete: (id: string) => api.delete(`/plants/${id}`),
};

export const areaApi = {
  // Métodos para vizinhança
  getAreaNeighbors: (areaId: string) => api.get<Area[]>(`/areas/${areaId}/neighbors`),
  addNeighbor: (areaId: string, neighborId: string, data?: Pick<AddNeighborRequest, 'connectionType' | 'notes'>) => 
    api.post(`/areas/${areaId}/neighbors`, {
      neighborId,
      ...data
    }),
  removeNeighbor: (areaId: string, neighborId: string) => 
    api.delete(`/areas/${areaId}/neighbors/${neighborId}`),
  checkNeighbors: (areaId: string, neighborId: string) => 
    api.get<{areNeighbors: boolean}>(`/areas/${areaId}/neighbors/${neighborId}`),
  
  // Métodos originais
  getAll: () => api.get<Area[]>('/areas'),
  getById: (id: string) => api.get<Area>(`/areas/${id}`),
  create: (data: Omit<Area, 'id' | 'createdAt' | 'updatedAt' | 'neighborRelations' | 'neighboredByRelations' | 'equipmentRelations'>) => 
    api.post<Area>('/areas', data),
  update: (id: string, data: Partial<Pick<Area, 'name' | 'locationDescription'>>) =>
    api.put<Area>(`/areas/${id}`, data),
  delete: (id: string) => api.delete(`/areas/${id}`),
};

export const equipmentApi = {
  // Métodos originais
  getAll: () => api.get<Equipment[]>('/equipment'),
  getById: (id: string) => api.get<Equipment>(`/equipment/${id}`),
  create: (data: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt' | 'areaRelations'>) =>
    api.post<Equipment>('/equipment', data),
  update: (id: string, data: Partial<Omit<Equipment, 'id' | 'createdAt' | 'updatedAt' | 'areaRelations'>>) =>
    api.put<Equipment>(`/equipment/${id}`, data),
  delete: (id: string) => api.delete(`/equipment/${id}`),
  
  // Métodos para múltiplas áreas
  getEquipmentAreas: (equipmentId: string) => 
    api.get<Area[]>(`/equipment/${equipmentId}/areas`),
  assignToAreas: (equipmentId: string, areaIds: string[], primaryAreaId?: string) =>
    api.post<Equipment>(`/equipment/${equipmentId}/areas`, { areaIds, primaryAreaId }),
  getPrimaryArea: (equipmentId: string) => 
    api.get<Area | null>(`/equipment/${equipmentId}/primaryArea`),
  checkAreaRelationship: (equipmentId: string, areaId: string) =>
    api.get<{inArea: boolean}>(`/equipment/${equipmentId}/areas/${areaId}`)
};

export const partApi = {
  getAll: () => api.get<Part[]>('/parts'),
  getById: (id: string) => api.get<Part>(`/parts/${id}`),
  create: (data: Omit<Part, 'id' | 'createdAt' | 'updatedAt'>) => api.post<Part>('/parts', data),
  update: (id: string, data: Partial<Omit<Part, 'id' | 'createdAt' | 'updatedAt'>>) =>
    api.put<Part>(`/parts/${id}`, data),
  delete: (id: string) => api.delete(`/parts/${id}`),
};