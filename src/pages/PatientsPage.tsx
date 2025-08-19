import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MagnifyingGlassIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import { getPatients, Patient, subscribeToUpdates } from '@/services/patientService';
import { Spinner } from '@/components/common/Spinner';

const ITEMS_PER_PAGE = 10; // Number of items per page

const PatientsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { 
    data: patientsData, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery<{ patients: Patient[]; total: number }>({
    queryKey: ['patients', searchTerm, currentPage],
    queryFn: () => getPatients({ name: searchTerm, page: currentPage, limit: ITEMS_PER_PAGE }),
    keepPreviousData: true,
  });

  // Refresh data when component mounts or when search term changes
  useEffect(() => {
    refetch();
  }, [searchTerm, refetch]);

  const totalPages = patientsData?.total ? Math.ceil(patientsData.total / ITEMS_PER_PAGE) : 1;
  const patients = patientsData?.patients || [];

  // Subscribe to real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    }, 5000);
    return () => clearInterval(interval);
  }, [queryClient]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToUpdates(() => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    });
    return () => unsubscribe();
  }, [queryClient]);

  const Pagination = () => {
    const maxPageButtons = 10;
    let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    
    // Ensure we show exactly maxPageButtons pages, or less if there aren't enough pages
    let endPage = startPage + maxPageButtons - 1;
    
    // Adjust if we're near the end
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }
    
    // Ensure we show exactly maxPageButtons pages if there are enough pages
    if (totalPages > maxPageButtons && endPage - startPage + 1 < maxPageButtons) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }
    
    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex flex-col items-center mt-4">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            «
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            ‹
          </button>
          
          {pageNumbers.map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`px-3 py-1 border rounded ${
                currentPage === pageNum 
                  ? 'bg-indigo-600 text-white' 
                  : 'hover:bg-gray-100'
              }`}
            >
              {pageNum}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            ›
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage >= totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            »
          </button>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          Page {currentPage} of {totalPages} • {patientsData?.total || 0} total patients
        </div>
      </div>
    );
  };

  const handleAddPatient = () => {
    navigate('/patients/new');
  };

  const handleEditPatient = (id: string) => {
    navigate(`/patients/${id}/edit`);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  if (isLoading && patients.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading patients
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error instanceof Error ? error.message : 'Failed to fetch patients'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Patients</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all the patients in your account including their name, contact information, and medical history.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={handleAddPatient}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Add patient
          </button>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="mt-4 relative rounded-md shadow-sm">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          name="search"
          id="search"
          className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          placeholder="Search patients..."
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      {/* Patients List */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Contact
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Gender
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Date of Birth
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {patient.firstName} {patient.lastName}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <div>{patient.email}</div>
                        <div className="text-gray-500">{patient.phoneNumber}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {patient.gender?.charAt(0).toUpperCase() + patient.gender?.slice(1) || 'N/A'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <button
                          onClick={() => handleEditPatient(patient.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <PencilIcon className="h-5 w-5" aria-hidden="true" />
                          <span className="sr-only">Edit {patient.firstName} {patient.lastName}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {patients.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No patients found. Try adjusting your search or add a new patient.
                </div>
              )}
            </div>
            <Pagination />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientsPage;
