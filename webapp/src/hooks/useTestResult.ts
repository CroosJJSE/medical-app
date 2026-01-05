// src/hooks/useTestResult.ts

import { useState, useEffect } from 'react';
import type { TestResult, LabValue } from '@/models/TestResult';
import testResultService from '@/services/testResultService';
import { NotFoundError } from '@/utils/errors';

interface UseTestResultReturn {
  testResult: TestResult | null;
  loading: boolean;
  error: Error | null;
  confirmData: (labValues: LabValue[]) => Promise<void>;
  updateData: (labValues: LabValue[]) => Promise<void>;
}

/**
 * Hook to fetch and manage a TestResult
 * @param testResultId - ID of the test result
 */
export function useTestResult(testResultId: string): UseTestResultReturn {
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!testResultId) {
      setError(new NotFoundError('Test Result ID is required'));
      setLoading(false);
      return;
    }

    setLoading(true);
    testResultService
      .getTestResult(testResultId)
      .then((data: TestResult | null) => {
        if (!data) throw new NotFoundError('Test Result not found');
        setTestResult(data);
      })
      .catch((err: Error) => setError(err))
      .finally(() => setLoading(false));
  }, [testResultId]);

  const confirmData = async (labValues: LabValue[]) => {
    if (!testResultId) throw new NotFoundError('Test Result ID is required');

    setLoading(true);
    try {
      await testResultService.confirmExtractedData(testResultId, '', labValues);
      setTestResult((prev: TestResult | null) =>
        prev
          ? {
              ...prev,
              labValues: labValues.map(lv => ({ ...lv, isConfirmed: true })),
              extractedData: {
                ...prev.extractedData,
                confirmed: true,
                confirmedAt: new Date(),
              },
            }
          : null
      );
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateData = async (labValues: LabValue[]) => {
    if (!testResultId) throw new NotFoundError('Test Result ID is required');

    setLoading(true);
    try {
      await testResultService.updateExtractedData(testResultId, labValues);
      setTestResult((prev: TestResult | null) =>
        prev ? { ...prev, labValues } : null
      );
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { testResult, loading, error, confirmData, updateData };
}
