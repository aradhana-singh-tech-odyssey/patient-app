// User-related types
export interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Patient-related types
export interface PatientAddress {
  line?: string[];
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface PatientContact {
  system: 'phone' | 'email' | 'url' | 'fax' | 'sms' | 'other';
  value: string;
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
}

export interface Patient {
  id?: string;
  resourceType?: 'Patient';
  name?: Array<{
    given?: string[];
    family?: string;
    text?: string;
  }>;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  telecom?: PatientContact[];
  address?: PatientAddress[];
  active?: boolean;
  meta?: {
    lastUpdated?: string;
    versionId?: string;
  };
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string | number;
    details?: any;
  };
  success: boolean;
}

// Auth-related types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn?: number;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
}

// Generic types
export type Nullable<T> = T | null;

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// Form-related types
export interface FormField<T> {
  value: T;
  error?: string;
  touched: boolean;
  validate: (value: T) => string | undefined;
}

export interface FormState {
  [key: string]: FormField<any>;
  isValid: boolean;
  isSubmitting: boolean;
}
