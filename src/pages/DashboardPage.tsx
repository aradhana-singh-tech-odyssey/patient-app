import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPatients, subscribeToUpdates } from '@/services/patientService';
import { Spinner } from '@/components/common/Spinner';
import { useEffect, useState } from 'react';
import GraphData from '@/components/GraphData';
import VitalsDisplay from '@/components/VitalsDisplay';

// Mock function to simulate fetching vitals data
// In a real app, this would be an API call
const fetchVitals = async (): Promise<Array<{
  name: string;
  value: number | string;
  unit: string;
  isAbnormal: boolean;
  timestamp: string;
}>> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      resolve([
        {
          name: 'Heart Rate',
          value: 88,
          unit: 'bpm',
          isAbnormal: false,
          timestamp: now.toISOString(),
        },
        {
          name: 'Blood Pressure',
          value: '120/80',
          unit: 'mmHg',
          isAbnormal: false,
          timestamp: now.toISOString(),
        },
        {
          name: 'Temperature',
          value: 38.5,
          unit: '°C',
          isAbnormal: true,
          timestamp: now.toISOString(),
        },
        {
          name: 'Oxygen',
          value: 95,
          unit: '%',
          isAbnormal: true,
          timestamp: oneHourAgo.toISOString(),
        },
      ]);
    }, 500);
  });
};

const DashboardPage = () => {
  // Get current date and date 7 days ago
  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);
  
  // State for vitals data
  const [vitals, setVitals] = useState<Array<{
    name: string;
    value: number | string;
    unit: string;
    isAbnormal: boolean;
    timestamp: string;
  }>>([]);
  const [isLoadingVitals, setIsLoadingVitals] = useState(true);

  // Query for total patients count (no pagination)
  const { 
    data: totalPatientsData, 
    isLoading: isLoadingTotal,
    refetch: refetchTotal 
  } = useQuery({
    queryKey: ['patients', 'total-count'],
    queryFn: () => getPatients({}),
    select: (data) => data.total,
    staleTime: 5 * 60 * 1000,
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
    select: (data) => data.total,
    staleTime: 5 * 60 * 1000,
  });

  // Query for all patients (for the graph)
  const { 
    data: allPatientsData,
    isLoading: isLoadingAllPatients 
  } = useQuery({
    queryKey: ['patients', 'all'],
    queryFn: () => getPatients({}),
    select: (data) => data.patients,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch vitals data
  useEffect(() => {
    const loadVitals = async () => {
      try {
        setIsLoadingVitals(true);
        const data = await fetchVitals();
        setVitals(data);
      } catch (error) {
        console.error('Error loading vitals:', error);
      } finally {
        setIsLoadingVitals(false);
      }
    };

    loadVitals();
    
    // Set up polling for vitals (every 5 minutes)
    const intervalId = setInterval(loadVitals, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Subscribe to patient updates
  useEffect(() => {
    const unsubscribe = subscribeToUpdates(() => {
      refetchTotal();
      refetchNew();
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
      name: 'Critical Alerts', 
      value: vitals.filter(v => v.isAbnormal).length, 
      change: vitals.filter(v => v.isAbnormal).length > 0 ? 'New' : undefined, 
      changeType: 'negative',
      link: '/vitals?filter=abnormal',
      loading: isLoadingVitals
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

      {/* Stats Grid */}
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
                ) : stat.name === 'Critical Alerts' && stat.value > 0 ? (
                  <span className="text-red-600">{stat.value}</span>
                ) : (
                  stat.value
                )}
              </dd>
              {stat.change && (
                <div className={`mt-2 flex items-baseline ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'} text-sm font-semibold`}>
                  {stat.change}
                  <span className="sr-only"> {stat.changeType === 'positive' ? 'Increased' : 'Decreased'} by</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Vitals Display */}
      <div className="mt-6">
        <VitalsDisplay 
          vitals={vitals} 
          isLoading={isLoadingVitals} 
        />
      </div>

      {/* Patient Analytics */}
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
