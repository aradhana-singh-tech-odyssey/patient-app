import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPatients, subscribeToUpdates } from '@/services/patientService';
import { Spinner } from '@/components/common/Spinner';
import { useEffect } from 'react';
import GraphData from '@/components/GraphData'; // Updated import to use default import

const DashboardPage = () => {
  // Get current date and date 7 days ago
  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);
  
  // Query for total patients count (no pagination)
  const { 
    data: totalPatientsData, 
    isLoading: isLoadingTotal,
    refetch: refetchTotal 
  } = useQuery({
    queryKey: ['patients', 'total-count'],
    queryFn: () => getPatients({}), // No pagination for total count
    select: (data) => data.total,   // Only return the total count
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Query for new patients this week
  const { 
    data: newPatientsThisWeek, 
    isLoading: isLoadingNew,
    refetch: refetchNew 
  } = useQuery({
    queryKey: ['patients', 'new-this-week'],
    queryFn: () => getPatients({ 
      createdAfter: oneWeekAgo.toISOString()
    }),
    select: (data) => data.total, // Only return the count
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Query for all patients (for the graph)
  const { 
    data: allPatientsData,
    isLoading: isLoadingAllPatients 
  } = useQuery({
    queryKey: ['patients', 'all'],
    queryFn: () => getPatients({}),
    select: (data) => data.patients,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Subscribe to patient updates
  useEffect(() => {
    const unsubscribe = subscribeToUpdates(() => {
      refetchTotal();
      refetchNew();
      // Add refetch for all patients
      allPatientsData?.refetch();
    });
    return () => unsubscribe();
  }, [refetchTotal, refetchNew, allPatientsData]);

  const stats = [
    { 
      name: 'Total Patients', 
      value: totalPatientsData?.toLocaleString() ?? '--', 
      change: '+2.5%', 
      changeType: 'positive',
      link: '/patients',
      loading: isLoadingTotal
    },
    { 
      name: 'New This Week', 
      value: newPatientsThisWeek?.toLocaleString() ?? '--', 
      change: '+1', 
      changeType: 'positive',
      link: '/patients?filter=new-this-week',
      loading: isLoadingNew
    },
    { 
      name: 'Appointments Today', 
      value: '2', 
      change: '+1', 
      changeType: 'positive',
      link: '/appointments?filter=today',
      loading: false
    },
    { 
      name: 'Pending Tasks', 
      value: '4', 
      change: '-2', 
      changeType: 'negative',
      link: '/tasks?status=pending',
      loading: false
    },
  ];

  // Combine loading states
  const isLoading = isLoadingTotal || isLoadingNew || isLoadingAllPatients;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
        <span className="ml-2 text-gray-500">Loading patient data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          {!isLoading && totalPatientsData !== undefined && (
            <p className="text-sm text-gray-500 mt-1">
              Total Patients: {totalPatientsData.toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex space-x-3">
          <Link
            to="/patients/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add New Patient
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.link}
            className="bg-white overflow-hidden shadow rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {stat.loading ? (
                  <div className="flex items-center">
                    <Spinner size="sm" className="mr-2" />
                    <span>--</span>
                  </div>
                ) : (
                  stat.value
                )}
              </dd>
              <div className={`mt-2 flex items-baseline ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'} text-sm font-semibold`}>
                {stat.change}
                <span className="sr-only"> {stat.changeType === 'positive' ? 'Increased' : 'Decreased'} by</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Add GraphData component */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Patient Analytics</h2>
        <GraphData 
          patients={allPatientsData || []} 
          isLoading={isLoadingAllPatients} 
        />
      </div>
    </div>
  );
};

export default DashboardPage;
