import { searchPatients, getPatientById as getFhirPatient, FhirPatient } from './fhirService';

// In-memory storage for patients
let inMemoryPatients: Patient[] = [];

// Track if initial sync is done
let isInitialSyncDone = false;
let isSyncing = false;

// Helper function to sync with FHIR server
const syncWithFhir = async (page: number = 1, limit: number = 50, isInitial: boolean = true) => {
  // Prevent multiple concurrent syncs
  if (isSyncing) return;
  
  // Only fetch first 10 pages
  if (page > 10) {
    if (isInitial) {
      isInitialSyncDone = true;
      notifyListeners();
    }
    return;
  }

  isSyncing = true;
  
  try {
    const { patients: fhirPatients } = await searchPatients('', page, limit);
    
    if (Array.isArray(fhirPatients) && fhirPatients.length > 0) {
      const newPatients = fhirPatients.map(patient => ({
        id: patient.id || `local-${Date.now()}`,
        firstName: patient.name?.[0]?.given?.[0] || '',
        lastName: patient.name?.[0]?.family || '',
        gender: (patient.gender as 'male' | 'female' | 'other') || 'other',
        dateOfBirth: patient.birthDate || '',
        email: patient.telecom?.find(t => t.system === 'email')?.value,
        phoneNumber: patient.telecom?.find(t => t.system === 'phone')?.value || '',
        address: patient.address?.[0]?.line?.join(', '),
        createdAt: patient.meta?.lastUpdated || new Date().toISOString()
      }));

      // Add new patients, avoiding duplicates
      newPatients.forEach(patient => {
        if (!inMemoryPatients.some(p => p.id === patient.id)) {
          inMemoryPatients.push(patient);
        }
      });

      // If we got a full page, fetch next page
      if (fhirPatients.length === limit) {
        await syncWithFhir(page + 1, limit, isInitial);
      } else if (isInitial) {
        isInitialSyncDone = true;
      }
    } else if (isInitial) {
      isInitialSyncDone = true;
    }
    
    // Notify listeners that we have new data
    notifyListeners();
  } catch (error) {
    console.error('Error syncing with FHIR server:', error);
    if (isInitial) {
      isInitialSyncDone = true;
      notifyListeners();
    }
  } finally {
    isSyncing = false;
  }
};

// Initial sync - only do this once
if (!isInitialSyncDone) {
  syncWithFhir(1, 50, true);
}

// Sync every 30 seconds
setInterval(() => {
  if (isInitialSyncDone) {
    syncWithFhir(1, 50, false);
  }
}, 30000);

// Event emitter for real-time updates
const listeners: Array<() => void> = [];

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

export const subscribeToUpdates = (callback: () => void) => {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
};

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  email?: string;
  phoneNumber: string;
  address?: string;
  medicalHistory?: string;
  createdAt?: string;
}

export interface PatientFilters {
  name?: string;
  gender?: string;
  birthDate?: string;
  page?: number;
  limit?: number;
  createdAfter?: string;
}

export const getPatients = async (filters?: PatientFilters): Promise<{ patients: Patient[]; total: number }> => {
  try {
    // If this is the first load and sync hasn't completed yet, trigger sync
    if (!isInitialSyncDone && inMemoryPatients.length === 0) {
      if (!isSyncing) {
        syncWithFhir(1, 50, true).catch(console.error);
      }
      // Return empty result but with the current total if available
      return { patients: [], total: inMemoryPatients.length };
    }

    let result = [...inMemoryPatients];
    
    // Apply filters
    if (filters) {
      if (filters.name) {
        const searchTerm = filters.name.toLowerCase();
        result = result.filter(patient => 
          `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm)
        );
      }
      
      if (filters.gender) {
        result = result.filter(patient => patient.gender === filters.gender);
      }
      
      if (filters.birthDate) {
        result = result.filter(patient => patient.dateOfBirth === filters.birthDate);
      }
      
      if (filters.createdAfter) {
        const createdAfterDate = new Date(filters.createdAfter);
        result = result.filter(patient => {
          if (!patient.createdAt) return true;
          const patientDate = new Date(patient.createdAt);
          return patientDate >= createdAfterDate;
        });
      }
    }
    
    // Get total count before pagination
    const total = result.length;
    
    // Apply pagination if needed
    if (filters?.page && filters?.limit) {
      const start = (filters.page - 1) * filters.limit;
      const end = start + filters.limit;
      result = result.slice(start, end);
    }
    
    return { patients: result, total };
  } catch (error) {
    console.error('Error in getPatients:', error);
    return { patients: [], total: 0 };
  }
};

export const getPatientById = async (id: string): Promise<Patient | null> => {
  try {
    const localPatient = inMemoryPatients.find(p => p.id === id);
    if (localPatient) return localPatient;

    const fhirPatient = await getFhirPatient(id);
    if (!fhirPatient) return null;
    
    const patient = {
      id: fhirPatient.id || `local-${Date.now()}`,
      firstName: fhirPatient.name?.[0]?.given?.[0] || '',
      lastName: fhirPatient.name?.[0]?.family || '',
      gender: (fhirPatient.gender as 'male' | 'female' | 'other') || 'other',
      dateOfBirth: fhirPatient.birthDate || '',
      email: fhirPatient.telecom?.find(t => t.system === 'email')?.value,
      phoneNumber: fhirPatient.telecom?.find(t => t.system === 'phone')?.value || '',
      address: fhirPatient.address?.[0]?.line?.join(', ')
    };

    // Add to in-memory cache
    inMemoryPatients = [...inMemoryPatients, patient];
    notifyListeners();
    
    return patient;
  } catch (error) {
    console.error('Error fetching patient:', error);
    return null;
  }
};

export const createPatient = async (patientData: Omit<Patient, 'id'>): Promise<Patient> => {
  try {
    const newPatient: Patient = {
      ...patientData,
      id: `local-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    inMemoryPatients = [...inMemoryPatients, newPatient];
    notifyListeners();

    // In a real implementation, you would make an API call here
    // const fhirPatient = await createFhirPatient(patientData);
    // Then update the local patient with the server ID
    // newPatient.id = fhirPatient.id;
    
    return newPatient;
  } catch (error) {
    console.error('Error creating patient:', error);
    throw new Error('Failed to create patient');
  }
};

export const updatePatient = async (id: string, updates: Partial<Patient>): Promise<Patient> => {
  try {
    const patientIndex = inMemoryPatients.findIndex(p => p.id === id);
    if (patientIndex === -1) {
      throw new Error('Patient not found');
    }

    const updatedPatient = {
      ...inMemoryPatients[patientIndex],
      ...updates,
      id // Ensure ID doesn't get overwritten
    };

    inMemoryPatients = [
      ...inMemoryPatients.slice(0, patientIndex),
      updatedPatient,
      ...inMemoryPatients.slice(patientIndex + 1)
    ];

    notifyListeners();

    // In a real implementation, you would make an API call here
    // await updateFhirPatient(id, updates);
    
    return updatedPatient;
  } catch (error) {
    console.error('Error updating patient:', error);
    throw new Error('Failed to update patient');
  }
};

export const deletePatient = async (id: string): Promise<void> => {
  try {
    inMemoryPatients = inMemoryPatients.filter(patient => patient.id !== id);
    notifyListeners();

    // In a real implementation, you would make an API call here
    // await deleteFhirPatient(id);
  } catch (error) {
    console.error('Error deleting patient:', error);
    throw new Error('Failed to delete patient');
  }
};

// Get the JWT token from localStorage or your auth context
export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Add a function to set the auth token
export const setAuthToken = (token: string | null): void => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};
