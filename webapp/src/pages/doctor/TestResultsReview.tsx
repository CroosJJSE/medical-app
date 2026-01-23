// src/pages/doctor/TestResultsReview.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
import Input from '@/components/common/Input';
import * as testResultService from '@/services/testResultService';
import type { TestResult, LabValue } from '@/models/TestResult';
import { LabValueStatus } from '@/enums';
import DoctorHeader from '@/components/layout/DoctorHeader';
import type { ParsedMedicalReport } from '@/services/medicalReportParser';
import patientService from '@/services/patientService';
import type { Patient } from '@/models/Patient';
import { convertToDate } from '@/utils/formatters';

const TestResultsReview: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [parsedReport, setParsedReport] = useState<ParsedMedicalReport | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [editingLabValues, setEditingLabValues] = useState<LabValue[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ value: string; unit: string }>({ value: '', unit: '' });
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadTestResults = async () => {
      const userId = user?.userID || user?.userId;
      console.log('[TEST_RESULTS_REVIEW] Loading test results', { userId, user });
      
      if (!userId) {
        console.warn('[TEST_RESULTS_REVIEW] No user ID, skipping load');
        setLoading(false);
        return;
      }
      
      try {
        console.log('[TEST_RESULTS_REVIEW] Fetching unconfirmed test results for doctor:', userId);
        // Get all unconfirmed test results for this doctor
        const unconfirmed = await testResultService.getUnconfirmedTestResultsByDoctor(userId);
        console.log('[TEST_RESULTS_REVIEW] Unconfirmed test results:', unconfirmed.length);
        setTestResults(unconfirmed);
        
        // Check if there's a testResultId in URL params and auto-select it
        const testResultId = searchParams.get('testResultId');
        if (testResultId && unconfirmed.length > 0) {
          console.log('[TEST_RESULTS_REVIEW] Found testResultId in URL:', testResultId);
          const result = unconfirmed.find(r => r.testResultId === testResultId);
          if (result) {
            console.log('[TEST_RESULTS_REVIEW] Auto-selecting test result:', testResultId);
            await handleSelectResult(result);
          } else {
            console.warn('[TEST_RESULTS_REVIEW] Test result not found in unconfirmed list:', testResultId);
          }
        }
      } catch (error) {
        console.error('[TEST_RESULTS_REVIEW] Error loading test results:', error);
      } finally {
        console.log('[TEST_RESULTS_REVIEW] Setting loading to false');
        setLoading(false);
      }
    };

    loadTestResults();
  }, [user, searchParams]);

  const handleSelectResult = async (result: TestResult) => {
    console.log('[TEST_RESULTS_REVIEW] Selecting test result:', result.testResultId);
    setSelectedResult(result);
    setEditingLabValues(result.labValues || []);
    setEditingIndex(null);
    setEditValues({ value: '', unit: '' });
    
    // Load parsed report
    try {
      console.log('[TEST_RESULTS_REVIEW] Loading parsed report...');
      const parsed = await testResultService.getParsedReport(result.testResultId);
      console.log('[TEST_RESULTS_REVIEW] Parsed report loaded:', !!parsed);
      setParsedReport(parsed);
    } catch (error) {
      console.error('[TEST_RESULTS_REVIEW] Error loading parsed report:', error);
      setParsedReport(null);
    }

    // Load patient info
    try {
      console.log('[TEST_RESULTS_REVIEW] Loading patient info:', result.patientId);
      const patientData = await patientService.getPatient(result.patientId);
      console.log('[TEST_RESULTS_REVIEW] Patient loaded:', patientData?.displayName);
      setPatient(patientData);
    } catch (error) {
      console.error('[TEST_RESULTS_REVIEW] Error loading patient:', error);
      setPatient(null);
    }

    // Set PDF URL from Firebase Storage
    const url = result.fileInfo.googleDriveUrl; // This field stores Firebase Storage URL
    console.log('[TEST_RESULTS_REVIEW] Setting PDF URL from Firebase Storage', { 
      url, 
      hasUrl: !!url,
      testResultId: result.testResultId,
      fileName: result.fileInfo.fileName
    });
    if (url) {
      setPdfUrl(url);
      console.log('[TEST_RESULTS_REVIEW] PDF URL set successfully for preview');
    } else {
      console.warn('[TEST_RESULTS_REVIEW] No PDF URL available for test result:', result.testResultId);
      console.warn('[TEST_RESULTS_REVIEW] This test result may have been uploaded before PDF storage was implemented');
      setPdfUrl(null);
    }
  };

  const handleConfirm = async () => {
    const userId = user?.userID || user?.userId;
    if (!selectedResult || !userId) {
      console.warn('[TEST_RESULTS_REVIEW] Cannot confirm: missing result or userId', { selectedResult: !!selectedResult, userId });
      return;
    }

    console.log('[TEST_RESULTS_REVIEW] Confirming test result:', selectedResult.testResultId);
    setConfirming(true);
    try {
      await testResultService.confirmExtractedData(
        selectedResult.testResultId,
        userId,
        editingLabValues
      );
      alert('Test result data confirmed successfully!');
      setSelectedResult(null);
      setParsedReport(null);
      setPatient(null);
      setPdfUrl(null);
      
      // Reload results
      console.log('[TEST_RESULTS_REVIEW] Reloading test results after confirmation...');
      const unconfirmed = await testResultService.getUnconfirmedTestResultsByDoctor(userId);
      setTestResults(unconfirmed);
    } catch (error) {
      console.error('[TEST_RESULTS_REVIEW] Error confirming test result:', error);
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
    <div className="min-h-screen bg-[#f5f7f8] flex flex-col">
      <DoctorHeader />
      <div className="flex-1 p-4">
        <div className="max-w-[1800px] mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Review Test Results</h1>
            <Button variant="secondary" onClick={() => navigate('/doctor/dashboard')}>
              Back to Dashboard
            </Button>
          </div>

          {!selectedResult ? (
            /* Test Results List */
            <Card title={`Pending Reviews (${testResults.length})`}>
              {testResults.length > 0 ? (
                <div className="space-y-2">
                  {testResults.map((result) => (
                    <div
                      key={result.testResultId}
                      className="border rounded p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => handleSelectResult(result)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-lg">{result.testInfo?.testName || 'Unknown Test'}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Uploaded: {(() => {
                              const uploadDate = convertToDate(result.fileInfo.uploadDate);
                              return uploadDate ? uploadDate.toLocaleDateString() : 'N/A';
                            })()}
                          </p>
                          {result.testInfo.labName && (
                            <p className="text-sm text-gray-500">Lab: {result.testInfo.labName}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {result.labValues?.length || 0} values extracted
                          </p>
                        </div>
                        {result.extractedData?.isExtracted && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            Data Extracted
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No pending reviews</p>
              )}
            </Card>
          ) : (
            /* Side-by-side Review View */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Side: PDF Preview */}
              <Card title="PDF Report" className="sticky top-4">
                <div className="space-y-4">
                  {pdfUrl ? (
                    <div className="space-y-2">
                      <div className="w-full h-[600px] border rounded overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <iframe
                          src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                          className="w-full h-full"
                          title="PDF Preview"
                          style={{ border: 'none' }}
                          onError={(e) => {
                            console.error('[TEST_RESULTS_REVIEW] Iframe error loading PDF:', e);
                          }}
                        />
                      </div>
                      {/* Direct link as backup */}
                      <div className="text-center">
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">open_in_new</span>
                          Open PDF in New Tab
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded p-8 text-center bg-gray-50 dark:bg-gray-700">
                      <div className="flex flex-col items-center gap-3">
                        <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-5xl">
                          description
                        </span>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">PDF Preview Not Available</p>
                        {selectedResult.fileInfo.fileName && (
                          <p className="text-sm text-gray-400 dark:text-gray-500">
                            File: {selectedResult.fileInfo.fileName}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 max-w-md">
                          This test result was uploaded before PDF storage was implemented. 
                          The extracted data is available below for review.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Report Information</h3>
                    {parsedReport && (
                      <div className="space-y-1 text-sm">
                        {parsedReport.patient_details.name && (
                          <p><span className="font-medium">Patient:</span> {parsedReport.patient_details.name}</p>
                        )}
                        {parsedReport.patient_details.uhid && (
                          <p><span className="font-medium">UHID:</span> {parsedReport.patient_details.uhid}</p>
                        )}
                        {parsedReport.report_metadata.sample_date_time && (
                          <p><span className="font-medium">Sample Date:</span> {parsedReport.report_metadata.sample_date_time}</p>
                        )}
                        {parsedReport.report_metadata.report_date_time && (
                          <p><span className="font-medium">Report Date:</span> {parsedReport.report_metadata.report_date_time}</p>
                        )}
                        {parsedReport.report_metadata.referred_by && (
                          <p><span className="font-medium">Referred By:</span> {parsedReport.report_metadata.referred_by}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Right Side: Extracted Data */}
              <Card title="Extracted Data - Review & Edit">
                <div className="space-y-6">
                  {/* Patient Info */}
                  {patient && (
                    <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded">
                      <p className="font-semibold">{patient.displayName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {patient.personalInfo.dateOfBirth && 
                          `DOB: ${new Date(patient.personalInfo.dateOfBirth).toLocaleDateString()}`
                        }
                      </p>
                    </div>
                  )}

                  {/* Doctor Attention Summary */}
                  {parsedReport && (
                    <div className="border-l-4 border-red-500 pl-4 py-2 bg-red-50 dark:bg-red-900">
                      <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">⚠️ Doctor Attention</h3>
                      {parsedReport.doctor_attention_summary.critical_findings.length > 0 && (
                        <div className="mb-2">
                          <p className="font-medium text-sm">Critical Findings:</p>
                          <ul className="list-disc list-inside text-sm">
                            {parsedReport.doctor_attention_summary.critical_findings.map((finding, idx) => (
                              <li key={idx}>{finding}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {parsedReport.doctor_attention_summary.positive_results.length > 0 && (
                        <div className="mb-2">
                          <p className="font-medium text-sm">Positive Results:</p>
                          <ul className="list-disc list-inside text-sm">
                            {parsedReport.doctor_attention_summary.positive_results.map((result, idx) => (
                              <li key={idx}>{result}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {parsedReport.doctor_attention_summary.abnormal_values.length > 0 && (
                        <div>
                          <p className="font-medium text-sm">Abnormal Values:</p>
                          <ul className="list-disc list-inside text-sm">
                            {parsedReport.doctor_attention_summary.abnormal_values.map((value, idx) => (
                              <li key={idx}>{value}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lab Values - Editable */}
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="font-semibold text-lg">Laboratory Values</h3>
                    </div>
                    {editingLabValues.length > 0 ? (
                      <div className="max-h-[500px] overflow-y-auto">
                        {editingLabValues.map((labValue, index) => {
                          const isEditing = editingIndex === index;
                          
                          const handleStartEdit = () => {
                            setEditingIndex(index);
                            setEditValues({
                              value: labValue.value?.toString() || '',
                              unit: labValue.unit || '',
                            });
                          };

                          const handleSaveEdit = () => {
                            const updated = [...editingLabValues];
                            updated[index] = {
                              ...updated[index],
                              value: editValues.value,
                              unit: editValues.unit,
                            };
                            setEditingLabValues(updated);
                            setEditingIndex(null);
                          };

                          const handleCancelEdit = () => {
                            setEditingIndex(null);
                            setEditValues({ value: '', unit: '' });
                          };

                          const handleRemove = () => {
                            const updated = editingLabValues.filter((_, i) => i !== index);
                            setEditingLabValues(updated);
                            if (editingIndex === index) {
                              setEditingIndex(null);
                            } else if (editingIndex !== null && editingIndex > index) {
                              setEditingIndex(editingIndex - 1);
                            }
                          };

                          return (
                            <div key={index} className="border-b border-gray-100 p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="mb-2">
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        value={labValue.testName || ''}
                                        onChange={(e) => {
                                          const updated = [...editingLabValues];
                                          updated[index].testName = e.target.value;
                                          setEditingLabValues(updated);
                                        }}
                                        className="text-blue-600 font-medium text-sm px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Test Name"
                                      />
                                    ) : (
                                      <span className="text-blue-600 font-medium text-sm">
                                        {labValue.testName || 'Test Name'}
                                      </span>
                                    )}
                                  </div>
                                  {isEditing ? (
                                    <div className="space-y-2">
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          value={editValues.value}
                                          onChange={(e) => setEditValues({ ...editValues, value: e.target.value })}
                                          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                                          placeholder="Value"
                                        />
                                        <input
                                          type="text"
                                          value={editValues.unit}
                                          onChange={(e) => setEditValues({ ...editValues, unit: e.target.value })}
                                          className="w-24 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                                          placeholder="Unit"
                                        />
                                      </div>
                                      {labValue.referenceRange && (
                                        <p className="text-xs text-gray-500">Reference: {labValue.referenceRange}</p>
                                      )}
                                      <div className="flex gap-2">
                                        <button
                                          onClick={handleSaveEdit}
                                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={handleCancelEdit}
                                          className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      <p className="text-black text-base font-medium">
                                        {labValue.value || 'N/A'}
                                        {labValue.unit && <span className="text-gray-600 ml-1">{labValue.unit}</span>}
                                      </p>
                                      {labValue.referenceRange && (
                                        <p className="text-xs text-gray-500 mt-1">Reference: {labValue.referenceRange}</p>
                                      )}
                                      {labValue.status && (
                                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${
                                          labValue.status === 'high' || labValue.status === 'critical' 
                                            ? 'bg-red-100 text-red-700' 
                                            : labValue.status === 'low' 
                                            ? 'bg-yellow-100 text-yellow-700' 
                                            : 'bg-green-100 text-green-700'
                                        }`}>
                                          {labValue.status.toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                {!isEditing && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={handleStartEdit}
                                      className="px-3 py-1.5 bg-blue-50 text-blue-600 text-sm rounded hover:bg-blue-100 transition-colors flex items-center gap-1"
                                      title="Edit"
                                    >
                                      <span className="material-symbols-outlined text-base">edit</span>
                                      Edit
                                    </button>
                                    <button
                                      onClick={handleRemove}
                                      className="px-3 py-1.5 bg-red-50 text-red-600 text-sm rounded hover:bg-red-100 transition-colors flex items-center gap-1"
                                      title="Remove"
                                    >
                                      <span className="material-symbols-outlined text-base">delete</span>
                                      Remove
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <p>No lab values extracted</p>
                      </div>
                    )}
                    <div className="p-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          const newLabValue: LabValue = {
                            testName: '',
                            value: '',
                            unit: '',
                            status: undefined,
                          };
                          const newIndex = editingLabValues.length;
                          setEditingLabValues([...editingLabValues, newLabValue]);
                          // Auto-edit the new row
                          setTimeout(() => {
                            setEditingIndex(newIndex);
                            setEditValues({ value: '', unit: '' });
                          }, 100);
                        }}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-base">add</span>
                        Add Row
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button onClick={handleConfirm} disabled={confirming} className="flex-1">
                      {confirming ? 'Confirming...' : 'Confirm & Save'}
                    </Button>
                    <Button 
                      variant="secondary" 
                      onClick={() => {
                        setSelectedResult(null);
                        setParsedReport(null);
                        setPatient(null);
                        setPdfUrl(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestResultsReview;
