// src/pages/doctor/TestResultsReview.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
import Input from '@/components/common/Input';
import * as testResultService from '@/services/testResultService';
import type { TestResult, LabValue } from '@/models/TestResult';
import { LabValueStatus } from '@/enums';

const TestResultsReview: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [editingLabValues, setEditingLabValues] = useState<LabValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const loadTestResults = async () => {
      if (!user?.userId) return;
      
      try {
        // Get all test results that need review (not confirmed)
        const allResults = await testResultService.getTestResultsByPatient(''); // TODO: Get all unconfirmed
        const unconfirmed = allResults.filter(r => !r.extractedData.confirmed);
        setTestResults(unconfirmed);
      } catch (error) {
        console.error('Error loading test results:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTestResults();
  }, [user]);

  const handleSelectResult = (result: TestResult) => {
    setSelectedResult(result);
    setEditingLabValues([...result.labValues]);
  };

  const handleConfirm = async () => {
    if (!selectedResult || !user?.userId) return;

    setConfirming(true);
    try {
      await testResultService.confirmExtractedData(
        selectedResult.testResultId,
        user.userId,
        editingLabValues
      );
      alert('Test result data confirmed successfully!');
      setSelectedResult(null);
      // Reload results
      const allResults = await testResultService.getTestResultsByPatient('');
      const unconfirmed = allResults.filter(r => !r.extractedData.confirmed);
      setTestResults(unconfirmed);
    } catch (error) {
      console.error('Error confirming test result:', error);
      alert('Error confirming test result. Please try again.');
    } finally {
      setConfirming(false);
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
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Review Test Results</h1>
          <Button variant="secondary" onClick={() => navigate('/doctor/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Results List */}
          <Card title={`Pending Reviews (${testResults.length})`}>
            {testResults.length > 0 ? (
              <div className="space-y-2">
                {testResults.map((result) => (
                  <div
                    key={result.testResultId}
                    className={`border rounded p-3 cursor-pointer ${
                      selectedResult?.testResultId === result.testResultId
                        ? 'bg-blue-50 dark:bg-blue-900 border-blue-500'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => handleSelectResult(result)}
                  >
                    <p className="font-semibold">{result.testInfo.testName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(result.fileInfo.uploadDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {result.labValues.length} values extracted
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No pending reviews</p>
            )}
          </Card>

          {/* Review Panel */}
          {selectedResult && (
            <Card title="Review Extracted Data">
              <div className="space-y-4">
                <div>
                  <p className="font-semibold">{selectedResult.testInfo.testName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Uploaded: {new Date(selectedResult.fileInfo.uploadDate).toLocaleDateString()}
                  </p>
                  {selectedResult.fileInfo.googleDriveUrl && (
                    <a
                      href={selectedResult.fileInfo.googleDriveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View PDF
                    </a>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Laboratory Values</h3>
                  {editingLabValues.length > 0 ? (
                    <div className="space-y-3">
                      {editingLabValues.map((labValue, index) => (
                        <div key={index} className="border rounded p-3">
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              label="Test Name"
                              value={labValue.testName}
                              onChange={(e) => {
                                const updated = [...editingLabValues];
                                updated[index].testName = e.target.value;
                                setEditingLabValues(updated);
                              }}
                            />
                            <Input
                              label="Value"
                              value={labValue.value.toString()}
                              onChange={(e) => {
                                const updated = [...editingLabValues];
                                updated[index].value = e.target.value;
                                setEditingLabValues(updated);
                              }}
                            />
                            <Input
                              label="Unit"
                              value={labValue.unit}
                              onChange={(e) => {
                                const updated = [...editingLabValues];
                                updated[index].unit = e.target.value;
                                setEditingLabValues(updated);
                              }}
                            />
                            <div>
                              <label className="block text-sm font-medium mb-1">Status</label>
                              <select
                                value={labValue.status}
                                onChange={(e) => {
                                  const updated = [...editingLabValues];
                                  updated[index].status = e.target.value as LabValueStatus;
                                  setEditingLabValues(updated);
                                }}
                                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
                              >
                                {Object.values(LabValueStatus).map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No lab values extracted</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleConfirm} disabled={confirming}>
                    {confirming ? 'Confirming...' : 'Confirm Data'}
                  </Button>
                  <Button variant="secondary" onClick={() => setSelectedResult(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestResultsReview;

