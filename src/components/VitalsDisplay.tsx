import React from 'react';

interface VitalSign {
  name: string;
  value: number | string;
  unit: string;
  isAbnormal: boolean;
  timestamp: string;
}

interface VitalsDisplayProps {
  vitals: VitalSign[];
  isLoading?: boolean;
}

const VitalsDisplay: React.FC<VitalsDisplayProps> = ({ vitals, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (vitals.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No vitals data available</p>
      </div>
    );
  }

  // Format timestamp to a readable format
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get the most recent timestamp
  const latestTimestamp = vitals.length > 0 
    ? new Date(Math.max(...vitals.map(v => new Date(v.timestamp).getTime())))
    : null;

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Latest Vitals</h3>
        {latestTimestamp && (
          <span className="text-sm text-gray-500">
            Last updated: {formatTimestamp(latestTimestamp.toString())}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {vitals.map((vital, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-lg border ${vital.isAbnormal ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">{vital.name}</p>
                <p className={`text-2xl font-semibold ${vital.isAbnormal ? 'text-red-600' : 'text-gray-900'}`}>
                  {vital.value} <span className="text-sm font-normal text-gray-500">{vital.unit}</span>
                </p>
              </div>
              {vital.isAbnormal && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Alert
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {formatTimestamp(vital.timestamp)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VitalsDisplay;
