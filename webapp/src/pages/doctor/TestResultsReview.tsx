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
import { engineRegistry } from '@/services/pdfEngines/engineRegistry';
import type { EngineExtractionResult } from '@/services/pdfEngines/types';

const TestResultsReview: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [parsedReport, setParsedReport] = useState<ParsedMedicalReport | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [editingLabValues, setEditingLabValues] = useState<LabValue[]>([]);
  const [approvedLabValues, setApprovedLabValues] = useState<LabValue[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ value: string; unit: string; referenceRange: string }>({ value: '', unit: '', referenceRange: '' });
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [selectedEngine, setSelectedEngine] = useState<string>('');
  const [extracting, setExtracting] = useState(false);
  const [availableEngines, setAvailableEngines] = useState<Array<{id: string; name: string; version: string; description: string}>>([]);

  useEffect(() => {
    // Load available engines
    const engines = engineRegistry.getAllEngineMetadata();
    setAvailableEngines(engines);
    if (engines.length > 0) {
      setSelectedEngine(engines[0].id); // Default to first engine
    }
  }, []);

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
        const unconfirmed = await testResultService.getUnconfirmedTestResultsByDoctor(userId);
        const resultsToShow = unconfirmed.filter(r => !r.extractedData?.confirmed);
        console.log('[TEST_RESULTS_REVIEW] Unconfirmed test results:', resultsToShow.length);
        setTestResults(resultsToShow);
        
        const testResultId = searchParams.get('testResultId');
        if (testResultId && resultsToShow.length > 0) {
          console.log('[TEST_RESULTS_REVIEW] Found testResultId in URL:', testResultId);
          const result = resultsToShow.find(r => r.testResultId === testResultId);
          if (result) {
            console.log('[TEST_RESULTS_REVIEW] Auto-selecting test result:', testResultId);
            await handleSelectResult(result);
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
    const extracted = (result.labValues || []).filter(lv => !lv.isConfirmed);
    const approved = (result.labValues || []).filter(lv => lv.isConfirmed);
    setEditingLabValues(extracted);
    setApprovedLabValues(approved);
    setEditingIndex(null);
    setEditValues({ value: '', unit: '', referenceRange: '' });
    
    try {
      console.log('[TEST_RESULTS_REVIEW] Loading parsed report...');
      const parsed = await testResultService.getParsedReport(result.testResultId);
      console.log('[TEST_RESULTS_REVIEW] Parsed report loaded:', !!parsed);
      setParsedReport(parsed);
    } catch (error) {
      console.error('[TEST_RESULTS_REVIEW] Error loading parsed report:', error);
      setParsedReport(null);
    }

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
    try {
      if (result.fileInfo.folderPath) {
        const storage = await import('firebase/storage');
        const { ref, getDownloadURL } = storage;
        const { storage: storageInstance } = await import('@/services/firebase');
        const storageRef = ref(storageInstance, result.fileInfo.folderPath);
        const url = await getDownloadURL(storageRef);
        console.log('[TEST_RESULTS_REVIEW] Setting PDF URL from Firebase Storage', { url, hasUrl: !!url, testResultId: result.testResultId, fileName: result.fileInfo.fileName });
        setPdfUrl(url);
        console.log('[TEST_RESULTS_REVIEW] PDF URL set successfully for preview');
      } else if (result.fileInfo.googleDriveUrl) {
        console.log('[TEST_RESULTS_REVIEW] Using Google Drive URL:', result.fileInfo.googleDriveUrl);
        setPdfUrl(result.fileInfo.googleDriveUrl);
      } else {
        console.warn('[TEST_RESULTS_REVIEW] No PDF URL available');
        setPdfUrl(null);
      }
    } catch (error) {
      console.error('[TEST_RESULTS_REVIEW] Error setting PDF URL:', error);
      setPdfUrl(null);
    }
  };

  const handleExtractWithEngine = async () => {
    if (!selectedResult || !selectedEngine) return;
    
    console.log('[TEST_RESULTS_REVIEW] Extracting with engine:', selectedEngine);
    setExtracting(true);
    try {
      const extractionResult: EngineExtractionResult = await testResultService.extractDataWithEngine(
        selectedResult.testResultId,
        selectedEngine
      );
      
      // Add new extracted values to editingLabValues
      const newLabValues = extractionResult.labValues.map(lv => ({
        ...lv,
        isConfirmed: false
      }));
      setEditingLabValues([...editingLabValues, ...newLabValues]);
    } catch (error) {
      console.error('[TEST_RESULTS_REVIEW] Error extracting with engine:', error);
      alert('Error extracting data. Please try again.');
    } finally {
      setExtracting(false);
    }
  };

  const handleApproveRow = (index: number) => {
    const row = editingLabValues[index];
    setApprovedLabValues([...approvedLabValues, { ...row, isConfirmed: true }]);
    setEditingLabValues(editingLabValues.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
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
      const allApprovedValues = approvedLabValues.map(lv => ({
        ...lv,
        isConfirmed: true
      }));
      
      await testResultService.confirmExtractedData(
        selectedResult.testResultId,
        userId,
        allApprovedValues
      );
      alert('Test result data confirmed successfully!');
      setSelectedResult(null);
      setParsedReport(null);
      setPatient(null);
      setPdfUrl(null);
      setEditingLabValues([]);
      setApprovedLabValues([]);
      
      const unconfirmed = await testResultService.getUnconfirmedTestResultsByDoctor(userId);
      setTestResults(unconfirmed);
    } catch (error) {
      console.error('[TEST_RESULTS_REVIEW] Error confirming test result:', error);
      alert('Error confirming test result. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  const getStatusBadgeClass = (status?: LabValueStatus | string) => {
    const statusUpper = (status || '').toUpperCase();
    if (statusUpper === 'HIGH' || statusUpper === 'CRITICAL') {
      return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400';
    }
    if (statusUpper === 'LOW') {
      return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400';
    }
    return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400';
  };

  const getStatusText = (status?: LabValueStatus | string) => {
    const statusUpper = (status || '').toUpperCase();
    if (statusUpper === 'HIGH' || statusUpper === 'CRITICAL') return 'HIGH';
    if (statusUpper === 'LOW') return 'LOW';
    return 'NORMAL';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loading size={48} message="Loading test results..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <DoctorHeader />
      
      {!selectedResult ? (
        /* Test Results List View */
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#111418] dark:text-white">Review Test Results</h1>
              <p className="text-sm text-[#60708a] mt-1">Pending Reviews ({testResults.length})</p>
            </div>
            
            {testResults.length > 0 ? (
              <div className="space-y-3">
                {testResults.map((result) => (
                  <div
                    key={result.testResultId}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-[#dbdfe6] dark:border-slate-700 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => handleSelectResult(result)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-[#111418] dark:text-white">
                          {result.testInfo?.testName || 'Unknown Test'}
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-[#60708a]">
                          <span>
                            Uploaded: {(() => {
                              const uploadDate = convertToDate(result.fileInfo.uploadDate);
                              return uploadDate ? uploadDate.toLocaleDateString() : 'N/A';
                            })()}
                          </span>
                          {result.testInfo?.labName && (
                            <span>Lab: {result.testInfo.labName}</span>
                          )}
                          <span>{result.labValues?.length || 0} values extracted</span>
                        </div>
                      </div>
                      {result.extractedData?.isExtracted && (
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-xs font-bold rounded-full">
                          Data Extracted
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#dbdfe6] dark:border-slate-700 p-12 text-center">
                <p className="text-[#60708a] text-lg">No pending reviews</p>
              </div>
            )}
          </div>
        </main>
      ) : (
        /* Side-by-Side Review View */
        <main className="flex flex-1 overflow-hidden">
          {/* Left Panel: PDF Viewer (50%) */}
          <section className="w-1/2 flex flex-col bg-slate-100 dark:bg-slate-800 border-r border-[#dbdfe6] dark:border-slate-700 overflow-hidden">
            {/* PDF Metadata Header */}
            <div className="p-4 bg-white dark:bg-slate-900 border-b border-[#dbdfe6] dark:border-slate-700">
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-[#60708a] font-bold">Patient Name</span>
                  <span className="text-sm font-semibold text-[#111418] dark:text-white">
                    {patient?.displayName || 'N/A'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-[#60708a] font-bold">UHID</span>
                  <span className="text-sm font-semibold text-[#111418] dark:text-white">
                    {parsedReport?.patient_details?.uhid || patient?.patientId || 'N/A'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-[#60708a] font-bold">Sample Date</span>
                  <span className="text-sm font-semibold text-[#111418] dark:text-white">
                    {parsedReport?.report_metadata?.sample_date_time || 
                     (selectedResult.testInfo?.testDate ? new Date(selectedResult.testInfo.testDate).toLocaleDateString() : 'N/A')}
                  </span>
                </div>
              </div>
            </div>
            
            {/* PDF View Area */}
            <div className="flex-1 p-6 overflow-y-auto flex justify-center">
              {pdfUrl ? (
                <div className="w-full max-w-[700px] shadow-2xl rounded-lg overflow-hidden bg-white">
                  <div className="aspect-[1/1.414] w-full bg-[#111418] relative">
                    <iframe
                      src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                      className="w-full h-full"
                      title="PDF Preview"
                      style={{ border: 'none' }}
                    />
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 flex justify-center">
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-bold transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">open_in_new</span>
                      Open PDF in New Tab
                    </a>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-[700px] bg-white dark:bg-slate-900 rounded-lg border border-[#dbdfe6] dark:border-slate-700 p-12 text-center">
                  <span className="material-symbols-outlined text-gray-400 text-5xl mb-3 block">description</span>
                  <p className="text-[#60708a] font-medium">PDF Preview Not Available</p>
                  {selectedResult.fileInfo.fileName && (
                    <p className="text-sm text-[#60708a] mt-2">File: {selectedResult.fileInfo.fileName}</p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Right Panel: Review Dashboard (50%) */}
          <section className="w-1/2 flex flex-col bg-white overflow-hidden">
            {/* Top Section: Control Bar */}
            <div className="px-6 py-4 bg-white border-b border-[#dbdfe6] flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-[#60708a] uppercase tracking-wider mb-1.5">
                  Extraction Engine
                </label>
                <div className="relative">
                  <select
                    value={selectedEngine}
                    onChange={(e) => setSelectedEngine(e.target.value)}
                    className="w-full h-10 pl-3 pr-10 rounded-lg border border-[#dbdfe6] bg-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none"
                    disabled={extracting}
                  >
                    {availableEngines.length === 0 && <option value="">Loading engines...</option>}
                    {availableEngines.map(engine => (
                      <option key={engine.id} value={engine.id}>
                        {engine.name} (v{engine.version})
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-2.5 pointer-events-none text-slate-400">unfold_more</span>
                </div>
                {selectedEngine && availableEngines.find(e => e.id === selectedEngine) && (
                  <p className="text-xs text-[#60708a] mt-1">
                    {availableEngines.find(e => e.id === selectedEngine)?.description}
                  </p>
                )}
              </div>
              <button
                onClick={handleExtractWithEngine}
                disabled={extracting || !selectedEngine || !pdfUrl}
                className="h-10 px-6 bg-primary hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm transition-all flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-lg">{extracting ? 'hourglass_empty' : 'bolt'}</span>
                {extracting ? 'Extracting...' : 'Extract Data'}
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Patient Info Card */}
              {patient && (
                <div className="bg-white rounded-xl p-4 border border-[#dbdfe6] flex items-center gap-4">
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-2xl">person</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{patient.displayName}</h3>
                    {patient.personalInfo?.dateOfBirth && (
                      <p className="text-xs text-[#60708a] font-medium">
                        DOB: {new Date(patient.personalInfo.dateOfBirth).toLocaleDateString()} 
                        ({Math.floor((Date.now() - new Date(patient.personalInfo.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years)
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Approved Values Section */}
              {approvedLabValues.length > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/50 overflow-hidden">
                  <div className="px-4 py-3 bg-emerald-100/50 dark:bg-emerald-900/30 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">check_circle</span>
                      <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                        Approved Values ({approvedLabValues.length})
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-full">
                      READY
                    </span>
                  </div>
                  <div className="divide-y divide-emerald-100 dark:divide-emerald-900/30">
                    {approvedLabValues.map((labValue, index) => (
                      <div key={index} className="p-4 flex justify-between items-center text-sm">
                        <span className="font-semibold text-primary">{labValue.testName}</span>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {labValue.value || 'N/A'} {labValue.unit && <span className="text-xs text-slate-500">{labValue.unit}</span>}
                          </span>
                          {labValue.status && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadgeClass(labValue.status)}`}>
                              {getStatusText(labValue.status)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted Values Section */}
              <div className="bg-white rounded-xl border border-[#dbdfe6] shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-[#dbdfe6] flex justify-between items-center">
                  <h4 className="text-sm font-bold text-[#111418]">Extracted Lab Values</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-full">
                    PENDING REVIEW ({editingLabValues.length})
                  </span>
                </div>
                {editingLabValues.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-[10px] uppercase font-bold text-[#60708a]">
                        <tr>
                          <th className="px-4 py-2">Test Name</th>
                          <th className="px-4 py-2">Value & Unit</th>
                          <th className="px-4 py-2">Ref. Range</th>
                          <th className="px-4 py-2">Status</th>
                          <th className="px-4 py-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#dbdfe6]">
                        {editingLabValues.map((labValue, index) => {
                          const isEditing = editingIndex === index;
                          
                          return (
                            <tr key={index} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={labValue.testName || ''}
                                    onChange={(e) => {
                                      const updated = [...editingLabValues];
                                      updated[index].testName = e.target.value;
                                      setEditingLabValues(updated);
                                    }}
                                    className="w-full px-2 py-1 border border-primary/30 rounded text-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  />
                                ) : (
                                  <span className="font-bold text-primary">{labValue.testName || 'Test Name'}</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {isEditing ? (
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={editValues.value}
                                      onChange={(e) => setEditValues({ ...editValues, value: e.target.value })}
                                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                      placeholder="Value"
                                    />
                                    <input
                                      type="text"
                                      value={editValues.unit}
                                      onChange={(e) => setEditValues({ ...editValues, unit: e.target.value })}
                                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                      placeholder="Unit"
                                    />
                                  </div>
                                ) : (
                                  <span>
                                    {labValue.value || 'N/A'} {labValue.unit && <span className="text-xs text-slate-500">{labValue.unit}</span>}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-500">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editValues.referenceRange}
                                    onChange={(e) => setEditValues({ ...editValues, referenceRange: e.target.value })}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    placeholder="Ref. Range"
                                  />
                                ) : (
                                  labValue.referenceRange || '—'
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {labValue.status && (
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadgeClass(labValue.status)}`}>
                                    {getStatusText(labValue.status)}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {isEditing ? (
                                  <div className="flex justify-end gap-1">
                                    <button
                                      onClick={() => {
                                        const updated = [...editingLabValues];
                                        updated[index] = {
                                          ...updated[index],
                                          value: editValues.value,
                                          unit: editValues.unit,
                                          referenceRange: editValues.referenceRange,
                                        };
                                        setEditingLabValues(updated);
                                        setEditingIndex(null);
                                        setEditValues({ value: '', unit: '', referenceRange: '' });
                                      }}
                                      className="p-1.5 hover:bg-emerald-500/10 rounded-md text-emerald-500"
                                      title="Save"
                                    >
                                      <span className="material-symbols-outlined text-lg">check</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingIndex(null);
                                        setEditValues({ value: '', unit: '', referenceRange: '' });
                                      }}
                                      className="p-1.5 hover:bg-red-500/10 rounded-md text-red-500"
                                      title="Cancel"
                                    >
                                      <span className="material-symbols-outlined text-lg">close</span>
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex justify-end gap-1">
                                    <button
                                      onClick={() => {
                                        setEditingIndex(index);
                                        setEditValues({
                                          value: labValue.value?.toString() || '',
                                          unit: labValue.unit || '',
                                          referenceRange: labValue.referenceRange || '',
                                        });
                                      }}
                                      className="p-1.5 hover:bg-primary/10 rounded-md text-primary"
                                      title="Edit"
                                    >
                                      <span className="material-symbols-outlined text-lg">edit</span>
                                    </button>
                                    <button
                                      onClick={() => handleApproveRow(index)}
                                      className="p-1.5 hover:bg-emerald-500/10 rounded-md text-emerald-500"
                                      title="Approve"
                                    >
                                      <span className="material-symbols-outlined text-lg">check_circle</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        const updated = editingLabValues.filter((_, i) => i !== index);
                                        setEditingLabValues(updated);
                                        if (editingIndex === index) {
                                          setEditingIndex(null);
                                        } else if (editingIndex !== null && editingIndex > index) {
                                          setEditingIndex(editingIndex - 1);
                                        }
                                      }}
                                      className="p-1.5 hover:bg-red-500/10 rounded-md text-red-500"
                                      title="Remove"
                                    >
                                      <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-[#60708a]">
                    <p>No lab values extracted. Use the extraction engine above to extract data.</p>
                  </div>
                )}
                <div className="p-3 bg-slate-50 flex justify-center border-t border-[#dbdfe6]">
                  <button
                    onClick={() => {
                      const newLabValue: LabValue = {
                        testName: '',
                        value: '',
                        unit: '',
                        status: undefined,
                        isConfirmed: false,
                        createdAt: new Date()
                      };
                      const newIndex = editingLabValues.length;
                      setEditingLabValues([...editingLabValues, newLabValue]);
                      setEditingIndex(newIndex);
                      setEditValues({ value: '', unit: '', referenceRange: '' });
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#60708a] hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">add_circle</span>
                    Add Lab Row
                  </button>
                </div>
              </div>
            </div>

            {/* Footer: Final Action */}
            <div className="px-6 py-4 bg-white border-t border-[#dbdfe6] shadow-[0_-4px_10px_rgba(0,0,0,0.03)] flex gap-4">
              <button
                onClick={handleConfirm}
                disabled={confirming || approvedLabValues.length === 0}
                className="flex-1 py-3 bg-primary hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm transition-all shadow-md"
              >
                {confirming ? 'Confirming...' : 'Confirm & Save to Record'}
              </button>
              <button
                onClick={() => {
                  setSelectedResult(null);
                  setParsedReport(null);
                  setPatient(null);
                  setPdfUrl(null);
                  setEditingLabValues([]);
                  setApprovedLabValues([]);
                }}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-sm transition-all"
              >
                Cancel
              </button>
            </div>
          </section>
        </main>
      )}
    </div>
  );
};

export default TestResultsReview;
