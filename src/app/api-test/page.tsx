"use client";

import { useState, useEffect } from 'react';

export default function ApiTestPage() {
  const [apiStatus, setApiStatus] = useState<string>('Testing...');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    testApi();
  }, []);

  const testApi = async () => {
    try {
      setApiStatus('Testing API...');
      setError('');
      
      const response = await fetch('/api/events');
      const text = await response.text();
      
      console.log('Raw response:', text);
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      // Try to parse as JSON
      try {
        const json = JSON.parse(text);
        setApiResponse(json);
        setApiStatus('API working!');
      } catch (parseError) {
        setError(`JSON Parse Error: ${parseError}. Raw response: ${text.substring(0, 200)}...`);
        setApiStatus('API returned non-JSON');
      }
    } catch (fetchError) {
      setError(`Fetch Error: ${fetchError}`);
      setApiStatus('API failed');
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">API Status</h2>
          <p className={`text-lg ${apiStatus.includes('working') ? 'text-green-600' : 'text-red-600'}`}>
            {apiStatus}
          </p>
          
          <button 
            onClick={testApi}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Again
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600 whitespace-pre-wrap">{error}</p>
          </div>
        )}

        {apiResponse && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-green-800 mb-4">API Response</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Environment Check</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
            <p><strong>API Endpoint:</strong> /api/events</p>
            <p><strong>Expected Response:</strong> JSON with events data</p>
          </div>
        </div>
      </div>
    </div>
  );
}
