import axios, { AxiosInstance } from 'axios';

// Create axios instance with base URL pointing to our proxy
const api: AxiosInstance = axios.create({
  baseURL: '/fhir', // This will be proxied to https://hapi.fhir.org/baseR4
  headers: {
    'Content-Type': 'application/fhir+json',
    'Accept': 'application/fhir+json',
  },
  // Remove withCredentials as it's not needed for the proxy
});

// Add request interceptor to include the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login or refresh token
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface FhirPatient {
  id?: string;
  resourceType: string;
  name?: Array<{
    given?: string[];
    family?: string;
  }>;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  telecom?: Array<{
    system?: 'phone' | 'email' | 'url';
    value?: string;
  }>;
  address?: Array<{
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>;
}

export interface SearchPatientsResponse {
  patients: FhirPatient[];
  total: number;
}

export const searchPatients = async (
  searchTerm: string = '', 
  page: number = 1, 
  pageSize: number = 10
): Promise<SearchPatientsResponse> => {
  try {
    const params = new URLSearchParams({
      _count: pageSize.toString(),
      _getpagesoffset: ((page - 1) * pageSize).toString(),
      _format: 'json',
      _pretty: 'true'
    });

    if (searchTerm) {
      params.append('name:contains', searchTerm);
    }

    const response = await api.get(`/Patient?${params.toString()}`);
    
    return {
      patients: response.data.entry?.map((entry: any) => entry.resource) || [],
      total: response.data.total || 0
    };
  } catch (error) {
    console.error('Error fetching patients from FHIR server:', error);
    return { patients: [], total: 0 };
  }
};

export const getPatientById = async (id: string): Promise<FhirPatient | null> => {
  try {
    const response = await api.get(`/Patient/${id}?_format=json`);
    return response.data;
  } catch (error) {
    console.error('Error fetching patient from FHIR server:', error);
    return null;
  }
};

// Helper function to map FHIR patient to our frontend model
const mapFhirToPatient = (fhirPatient: any) => {
  const name = fhirPatient.name?.[0];
  return {
    id: fhirPatient.id,
    name: name ? `${name.given?.join(' ') || ''} ${name.family || ''}`.trim() : 'Unknown',
    gender: fhirPatient.gender,
    birthDate: fhirPatient.birthDate,
    phone: fhirPatient.telecom?.find((t: any) => t.system === 'phone')?.value,
    email: fhirPatient.telecom?.find((t: any) => t.system === 'email')?.value,
    address: fhirPatient.address?.[0] ? 
      `${fhirPatient.address[0].line?.join(', ') || ''}, ${fhirPatient.address[0].city || ''} ${fhirPatient.address[0].state || ''} ${fhirPatient.address[0].postalCode || ''}`.replace(/\s+/g, ' ').trim() : ''
  };
};

// Add this function to handle setting the auth token
export const setAuthToken = (token: string | null): void => {
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

// Add this function to check authentication status
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};

// Add this function to handle user logout
export const logout = (): void => {
  localStorage.removeItem('token');
  delete api.defaults.headers.common['Authorization'];
};
