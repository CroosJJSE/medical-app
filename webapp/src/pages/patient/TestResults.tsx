// src/pages/patient/TestResults.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
import Input from '@/components/common/Input';
import * as testResultService from '@/services/testResultService';
import type { TestResult } from '@/models/TestResult';

const TestResults: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [testName, setTestName] = useState('');

  useEffect(() => {
    const loadTestResults = async () => {
      if (!user?.userId) return;
      
      try {
        const data = await testResultService.getTestResultsByPatient(user.userId);
        setTestResults(data.sort((a, b) => b.fileInfo.uploadDate.getTime() - a.fileInfo.uploadDate.getTime()));
      } catch (error) {
        console.error('Error loading test results:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTestResults();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !user?.userId) return;

    setUploading(true);
    try {
      await testResultService.uploadTestResult(user.userId, file, {
        testName: testName || file.name,
        testDate: new Date(),
      });
      // Reload test results
      const data = await testResultService.getTestResultsByPatient(user.userId);
      setTestResults(data.sort((a, b) => b.fileInfo.uploadDate.getTime() - a.fileInfo.uploadDate.getTime()));
      setFile(null);
      setTestName('');
      alert('Test result uploaded successfully!');
    } catch (error) {
      console.error('Error uploading test result:', error);
      alert('Error uploading test result. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size={48} message="Loading test results..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Test Results</h1>
          <Button variant="secondary" onClick={() => navigate('/patient/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        {/* Upload Section */}
        <Card title="Upload Test Result">
          <div className="space-y-4">
            <Input
              label="Test Name (optional)"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="e.g., Complete Blood Count"
            />
            <div>
              <label className="block text-sm font-medium mb-2">Select PDF File</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
              />
            </div>
            {file && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
            <Button onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? 'Uploading...' : 'Upload Test Result'}
            </Button>
          </div>
        </Card>

        {/* Test Results List */}
        <Card title={`Test Results (${testResults.length})`}>
          {testResults.length > 0 ? (
            <div className="space-y-4">
              {testResults.map((result) => (
                <div
                  key={result.testResultId}
                  className="border rounded p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-lg">{result.testInfo.testName}</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Uploaded: {new Date(result.fileInfo.uploadDate).toLocaleDateString()}
                      </p>
                      {result.testInfo.testDate && (
                        <p className="text-sm text-gray-500">
                          Test Date: {new Date(result.testInfo.testDate).toLocaleDateString()}
                        </p>
                      )}
                      {result.extractedData.confirmed && (
                        <p className="text-sm text-green-600 mt-2">✓ Data confirmed by doctor</p>
                      )}
                    </div>
                    {result.fileInfo.googleDriveUrl && (
                      <a
                        href={result.fileInfo.googleDriveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View PDF
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No test results uploaded yet</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TestResults;

