/* eslint-disable no-undef */
import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from '../useErrorHandler';

describe('useErrorHandler', () => {
  test('handles error correctly', () => {
    const { result } = renderHook(() => useErrorHandler());

    const testError = new Error('Test error');

    act(() => {
      result.current.handleError(testError, 'test context');
    });

    expect(result.current.error).toEqual({
      message: 'Si è verificato un errore imprevisto. Riprova più tardi.',
      originalError: testError,
      context: 'test context',
      timestamp: expect.any(Number)
    });
  });

  test('handles Firebase auth errors with user-friendly messages', () => {
    const { result } = renderHook(() => useErrorHandler());

    const authError = { code: 'auth/user-not-found' };

    act(() => {
      result.current.handleError(authError);
    });

    expect(result.current.error.message).toBe('Utente non trovato. Verifica le credenziali.');
  });

  test('clears error', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.handleError(new Error('Test'));
    });

    expect(result.current.error).toBeTruthy();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  test('retry function works correctly', async () => {
    const { result } = renderHook(() => useErrorHandler());

    let attempts = 0;
    const mockOperation = jest.fn(() => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Operation failed');
      }
      return Promise.resolve('success');
    });

    let resultValue;
    await act(async () => {
      resultValue = await result.current.retry(mockOperation, 3, 100);
    });

    expect(mockOperation).toHaveBeenCalledTimes(3);
    expect(resultValue).toBe('success');
    expect(result.current.error).toBeNull();
  });

  test('retry function fails after max attempts', async () => {
    const { result } = renderHook(() => useErrorHandler());

    const mockOperation = jest.fn(() => {
      throw new Error('Always fails');
    });

    await act(async () => {
      try {
        await result.current.retry(mockOperation, 2, 10);
      } catch (error) {
        // Expected to fail
      }
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.error.message).toBe('Si è verificato un errore imprevisto. Riprova più tardi.');
  });
});