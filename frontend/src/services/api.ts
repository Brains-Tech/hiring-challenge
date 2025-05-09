import axios from 'axios';
import { getCookie } from 'cookies-next';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getCookie('COODEX::TOKEN');

    if (token && typeof token === 'string') {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface Plant {
  id: string;
  name: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface Area {
  id: string;
  name: string;
  locationDescription: string;
  plantId: string;
  plant?: Plant;
  createdAt: string;
  updatedAt: string;
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
}

export enum PartType {
  ELECTRIC = "electric",
  ELECTRONIC = "electronic",
  MECHANICAL = "mechanical",
  HYDRAULICAL = "hydraulical"
}

export enum MaintenanceRecurrenceEnum {
  NONE = "none",
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  SEMIANNUAL = "semiannual",
  ANNUAL = "annual",
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


export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
  updatedAt: string;
}

export interface Maintenance {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  scheduledDate?: Date;
  recurrence: MaintenanceRecurrenceEnum;
  dueDate: Date;
  description?: string;
  part: {
    id: string;
    name: string;
    installationDate?: Date;
  };
  equipment: {
    id: string;
    name: string;
    initialOperationsDate?: Date;
  };
  area: {
    id: string;
    name: string;
  };
  plant: {
    id: string;
    name: string;
  };
}

export interface CreateUpdateMaintenanceDTO {
  title: string;
  recurrence: MaintenanceRecurrenceEnum;
  scheduledDate?: Date;
  description?: string;
  partId: string;
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
  getAll: () => api.get<Area[]>('/areas'),
  getById: (id: string) => api.get<Area>(`/areas/${id}`),
  create: (data: Omit<Area, 'id' | 'createdAt' | 'updatedAt'>) => api.post<Area>('/areas', data),
  update: (id: string, data: Partial<Omit<Area, 'id' | 'createdAt' | 'updatedAt'>>) =>
    api.put<Area>(`/areas/${id}`, data),
  delete: (id: string) => api.delete(`/areas/${id}`),
};

export const equipmentApi = {
  getAll: () => api.get<Equipment[]>('/equipment'),
  getById: (id: string) => api.get<Equipment>(`/equipment/${id}`),
  create: (data: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<Equipment>('/equipment', data),
  update: (id: string, data: Partial<Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>>) =>
    api.put<Equipment>(`/equipment/${id}`, data),
  delete: (id: string) => api.delete(`/equipment/${id}`),
};

export const partApi = {
  getAll: () => api.get<Part[]>('/parts'),
  getById: (id: string) => api.get<Part>(`/parts/${id}`),
  create: (data: Omit<Part, 'id' | 'createdAt' | 'updatedAt'>) => api.post<Part>('/parts', data),
  update: (id: string, data: Partial<Omit<Part, 'id' | 'createdAt' | 'updatedAt'>>) =>
    api.put<Part>(`/parts/${id}`, data),
  delete: (id: string) => api.delete(`/parts/${id}`),
};


export const maintenanceApi = {
  getAll: () => api.get<Maintenance[]>('/maintenance'),
  getById: (id: string) => api.get<Maintenance>(`/maintenance/${id}`),
  create: (data: CreateUpdateMaintenanceDTO) => api.post<Maintenance>('/maintenance', data),
  update: (id: string, data: CreateUpdateMaintenanceDTO) =>
    api.put<Maintenance>(`/maintenance/${id}`, data),
  delete: (id: string) => api.delete(`/maintenance/${id}`),
}

export const authApi = {
  login: (data: { email: string, password: string }) =>
    api.post<{ user: User, token: string }>('/auth/login', { email: data.email, password: data.password }),
  register: (data: { name: string; email: string; password: string }) =>
    api.post<User>('/auth/register', { name: data.name, email: data.email, password: data.password }),
}


