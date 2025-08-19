import React from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Patient } from '@/services/patientService';

// Register ChartJS components
ChartJS.register(...registerables);

interface GraphDataProps {
  patients: Patient[];
  isLoading: boolean;
}

const GraphData: React.FC<GraphDataProps> = ({ patients, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No patient data available for visualization</p>
      </div>
    );
  }

  // Process data for charts
  const processGenderData = () => {
    const genderCounts = patients.reduce((acc, patient) => {
      acc[patient.gender] = (acc[patient.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(genderCounts),
      datasets: [
        {
          label: 'Patients by Gender',
          data: Object.values(genderCounts),
          backgroundColor: [
            'rgba(99, 102, 241, 0.7)',
            'rgba(236, 72, 153, 0.7)',
            'rgba(16, 185, 129, 0.7)',
          ],
          borderColor: [
            'rgba(99, 102, 241, 1)',
            'rgba(236, 72, 153, 1)',
            'rgba(16, 185, 129, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const processMonthlyData = () => {
    // Group by month
    const monthlyData = patients.reduce((acc, patient) => {
      if (!patient.createdAt) return acc;
      
      const date = new Date(patient.createdAt);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      acc[monthYear] = (acc[monthYear] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Sort by date
    const sortedMonths = Object.keys(monthlyData).sort();
    
    return {
      labels: sortedMonths,
      datasets: [
        {
          label: 'New Patients',
          data: sortedMonths.map(month => monthlyData[month]),
          backgroundColor: 'rgba(99, 102, 241, 0.7)',
          borderColor: 'rgba(99, 102, 241, 1)',
          tension: 0.3,
          fill: true,
        },
      ],
    };
  };

  const processAgeDistribution = () => {
    const ageRanges = {
      '0-18': 0,
      '19-30': 0,
      '31-45': 0,
      '46-60': 0,
      '61+': 0,
    };

    patients.forEach(patient => {
      if (!patient.dateOfBirth) return;
      
      const birthDate = new Date(patient.dateOfBirth);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      
      if (age <= 18) ageRanges['0-18']++;
      else if (age <= 30) ageRanges['19-30']++;
      else if (age <= 45) ageRanges['31-45']++;
      else if (age <= 60) ageRanges['46-60']++;
      else ageRanges['61+']++;
    });

    return {
      labels: Object.keys(ageRanges),
      datasets: [
        {
          label: 'Age Distribution',
          data: Object.values(ageRanges),
          backgroundColor: [
            'rgba(99, 102, 241, 0.7)',
            'rgba(236, 72, 153, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(239, 68, 68, 0.7)',
          ],
          borderColor: [
            'rgba(99, 102, 241, 1)',
            'rgba(236, 72, 153, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(239, 68, 68, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Patients by Gender</h3>
          <div className="h-64">
            <Pie data={processGenderData()} options={chartOptions} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Age Distribution</h3>
          <div className="h-64">
            <Bar data={processAgeDistribution()} options={chartOptions} />
          </div>
        </div>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">New Patients Over Time</h3>
        <div className="h-80">
          <Line data={processMonthlyData()} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default GraphData;
