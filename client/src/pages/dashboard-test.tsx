import React, { useState, useEffect } from 'react';

export default function DashboardTestPage() {
  const [apiResponse, setApiResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Function to fetch API data
  const fetchApiData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setError('Failed to fetch API data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 'bold' }}>
        Dashboard Test Page - Basic Version
      </h1>
      
      <div style={{ marginBottom: '20px' }}>
        <p style={{ marginBottom: '10px' }}>
          This is a simple test page to verify the API is working.
        </p>
        
        <button 
          onClick={fetchApiData}
          style={{
            backgroundColor: '#4f46e5',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Fetch API Data
        </button>
        
        <a 
          href="/api/dashboard/stats" 
          target="_blank" 
          style={{ 
            color: '#4f46e5', 
            textDecoration: 'underline' 
          }}
        >
          Open API Directly
        </a>
      </div>
      
      {isLoading && (
        <div style={{ padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
          Loading API data...
        </div>
      )}
      
      {error && (
        <div style={{ padding: '20px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '4px' }}>
          {error}
        </div>
      )}
      
      {apiResponse && (
        <div style={{ marginTop: '20px' }}>
          <h2 style={{ marginBottom: '10px', fontSize: '18px', fontWeight: 'bold' }}>API Response:</h2>
          <pre style={{ 
            padding: '15px', 
            backgroundColor: '#f3f4f6', 
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '400px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {apiResponse}
          </pre>
        </div>
      )}
    </div>
  );
}