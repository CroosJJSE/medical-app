// src/pages/patient/TestResults.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Loading from '@/components/common/Loading';
import Input from '@/components/common/Input';
import * as testResultService from '@/services/testResultService';
import type { TestResult } from '@/models/TestResult';
import { convertToDate } from '@/utils/formatters';

const TestResults: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [testName, setTestName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const userId = user?.userID || user?.userId;
    console.log('[TEST_RESULTS_PAGE] useEffect triggered', { userId, user, loading });
    
    const loadTestResults = async () => {
      console.log('[TEST_RESULTS_PAGE] loadTestResults called', { userId });
      
      if (!userId) {
        console.warn('[TEST_RESULTS_PAGE] No user ID, skipping load');
        setLoading(false);
        return;
      }
      
      try {
        console.log('[TEST_RESULTS_PAGE] Fetching test results for patient:', userId);
        const data = await testResultService.getTestResultsByPatient(userId);
        console.log('[TEST_RESULTS_PAGE] Test results fetched:', data.length, 'results');
        // Sort by upload date, handling Firestore Timestamps
        const sorted = data.sort((a, b) => {
          const dateA = convertToDate(a.fileInfo.uploadDate);
          const dateB = convertToDate(b.fileInfo.uploadDate);
          if (!dateA || !dateB) return 0;
          return dateB.getTime() - dateA.getTime();
        });
        setTestResults(sorted);
      } catch (error) {
        console.error('[TEST_RESULTS_PAGE] Error loading test results:', error);
      } finally {
        console.log('[TEST_RESULTS_PAGE] Setting loading to false');
        setLoading(false);
      }
    };

    loadTestResults();
  }, [user]);

  const handleFileChange = (selectedFile: File) => {
    console.log('[TEST_RESULTS_PAGE] File selected', { file: selectedFile });
    
    if (selectedFile.type !== 'application/pdf') {
      alert('Please upload a PDF file only.');
      return;
    }

    const selectedFileObj = selectedFile;
    console.log('[TEST_RESULTS_PAGE] File details:', {
      name: selectedFileObj.name,
      type: selectedFileObj.type,
      size: selectedFileObj.size,
    });
    setFile(selectedFileObj);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    const userId = user?.userID || user?.userId;
    console.log('[TEST_RESULTS_PAGE] handleUpload called', { 
      hasFile: !!file, 
      userId,
      user,
      fileName: file?.name,
      testName 
    });

    if (!file) {
      console.warn('[TEST_RESULTS_PAGE] Missing file');
      alert('Please select a PDF file to upload.');
      return;
    }

    if (!userId) {
      console.warn('[TEST_RESULTS_PAGE] Missing userId', { user });
      alert('Please log in to upload test results.');
      return;
    }

    console.log('[TEST_RESULTS_PAGE] Starting upload process...');
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      console.log('[TEST_RESULTS_PAGE] Calling uploadTestResultWithFile...');
      const result = await testResultService.uploadTestResultWithFile(
        userId,
        file,
        testName || undefined
      );
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      console.log('[TEST_RESULTS_PAGE] Upload successful:', result.testResultId);
      
      // Reload test results
      console.log('[TEST_RESULTS_PAGE] Reloading test results...');
      const data = await testResultService.getTestResultsByPatient(userId);
      console.log('[TEST_RESULTS_PAGE] Reloaded test results:', data.length);
      // Sort by upload date, handling Firestore Timestamps
      const sorted = data.sort((a, b) => {
        const dateA = convertToDate(a.fileInfo.uploadDate);
        const dateB = convertToDate(b.fileInfo.uploadDate);
        if (!dateA || !dateB) return 0;
        return dateB.getTime() - dateA.getTime();
      });
      setTestResults(sorted);
      setFile(null);
      setTestName('');
      setUploadProgress(0);
      alert('Test result uploaded successfully! Your doctor will be notified to review it.');
    } catch (error) {
      console.error('[TEST_RESULTS_PAGE] Error uploading test result:', error);
      console.error('[TEST_RESULTS_PAGE] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      setUploadProgress(0);
      alert(`Error uploading test result: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      console.log('[TEST_RESULTS_PAGE] Upload process finished, setting uploading to false');
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <Loading size={48} message="Loading test results..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Test Results
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              Upload and manage your laboratory test results
            </p>
          </div>
          <Button 
            variant="secondary" 
            onClick={() => navigate('/patient/dashboard')}
            className="w-full sm:w-auto"
          >
            <span className="material-symbols-outlined mr-2 text-sm">arrow_back</span>
            Back to Dashboard
          </Button>
        </div>

        {/* Upload Section - Modern Card Design */}
        <Card className="shadow-xl border-0 bg-white dark:bg-gray-800">
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">
                  upload_file
                </span>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Upload Test Result
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload your laboratory report PDF
                </p>
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {/* Test Name Input */}
              <div>
                <Input
                  label="Test Name (optional)"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="e.g., Complete Blood Count, Lipid Profile"
                  disabled={uploading}
                />
              </div>

              {/* Drag and Drop Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all duration-200 ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : file
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:border-blue-400 dark:hover:border-blue-500'
                } ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
                onClick={() => !uploading && document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileInputChange}
                  className="hidden"
                  disabled={uploading}
                />
                
                {file ? (
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <div className="p-4 bg-green-100 dark:bg-green-900 rounded-full">
                        <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-4xl">
                          check_circle
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="text-sm text-red-600 dark:text-red-400 hover:underline"
                      disabled={uploading}
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-full">
                        <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-5xl">
                          description
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Drag & drop your PDF here
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        or click to browse
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        PDF files only • Max size: 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full sm:w-auto sm:min-w-[200px]"
                variant="primary"
              >
                {uploading ? (
                  <>
                    <span className="material-symbols-outlined mr-2 animate-spin">sync</span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined mr-2">cloud_upload</span>
                    Upload Test Result
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Test Results List */}
        <Card className="shadow-xl border-0 bg-white dark:bg-gray-800">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                  <span className="material-symbols-outlined text-indigo-600 dark:text-indigo-400">
                    science
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Your Test Results
                </h2>
              </div>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-semibold">
                {testResults.length}
              </span>
            </div>

            {testResults.length > 0 ? (
              <div className="space-y-4">
                {testResults.map((result) => (
                  <div
                    key={result.testResultId}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-200 bg-white dark:bg-gray-700/50"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg mt-1">
                            <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 text-xl">
                              description
                            </span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                              {result.testInfo.testName}
                            </h3>
                            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-base">calendar_today</span>
                                <span>
                                  {(() => {
                                    const uploadDate = convertToDate(result.fileInfo.uploadDate);
                                    return uploadDate ? uploadDate.toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    }) : 'N/A';
                                  })()}
                                </span>
                              </div>
                              {result.testInfo?.testDate && (
                                <div className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-base">event</span>
                                  <span>
                                    Test: {(() => {
                                      const testDate = convertToDate(result.testInfo.testDate);
                                      return testDate ? testDate.toLocaleDateString() : 'N/A';
                                    })()}
                                  </span>
                                </div>
                              )}
                              {result.testInfo.labName && (
                                <div className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-base">business</span>
                                  <span>{result.testInfo.labName}</span>
                                </div>
                              )}
                            </div>
                            {result.extractedData?.confirmed ? (
                              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg text-sm font-medium">
                                <span className="material-symbols-outlined text-base">verified</span>
                                Confirmed by doctor
                              </div>
                            ) : result.extractedData?.isExtracted ? (
                              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm font-medium">
                                <span className="material-symbols-outlined text-base">pending</span>
                                Pending doctor review
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        {result.fileInfo.googleDriveUrl && (
                          <a
                            href={result.fileInfo.googleDriveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            <span className="material-symbols-outlined text-base">visibility</span>
                            View PDF
                          </a>
                        )}
                        {result.labValues && result.labValues.length > 0 && (
                          <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
                            <span className="material-symbols-outlined text-base">data_object</span>
                            {result.labValues.length} values
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full">
                    <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-5xl">
                      science
                    </span>
                  </div>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">
                  No test results yet
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  Upload your first test result to get started
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TestResults;
