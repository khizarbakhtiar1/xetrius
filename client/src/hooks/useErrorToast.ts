'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { parseContractError } from '@/lib/errors';
import { logger } from '@/lib/logger';

/**
 * Wraps parseContractError and fires a toast notification.
 * Returns the parsed message so callers can also use it for local state.
 */
export function useErrorToast() {
  const handleError = useCallback((error: unknown) => {
    const message = parseContractError(error);
    toast.error(message);
    logger.error('Contract error:', message, error);
    return message;
  }, []);

  return { handleError };
}
