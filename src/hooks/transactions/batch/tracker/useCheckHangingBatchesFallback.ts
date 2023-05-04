import { useCallback, useEffect } from 'react';
import { useGetBatches } from '../useGetBatches';
import {
  AVERAGE_TX_DURATION_MS,
  TRANSACTIONS_STATUS_DROP_INTERVAL_MS
} from 'constants/transactionStatus';
import { sequentialToFlatArray } from 'utils/transactions/batch/sequentialToFlatArray';
import { getTransactionsStatus } from 'utils/transactions/batch/getTransactionsStatus';
import { removeBatchTransactions } from 'services/transactions';
import { useUpdateBatch } from './useUpdateBatch';

/**
 * Fallback mechanism to check hanging batches
 * Resolves the toast and set the status to failed for each transaction after a certain time (10minutes)
 * */
export const useCheckHangingBatchesFallback = () => {
  const { batchTransactionsArray } = useGetBatches();
  const updateBatch = useUpdateBatch();

  const isBatchHanding = useCallback((batchId: string, olderThanMs: number) => {
    const sessionTimestamp = parseInt(batchId.split('-')[0]);

    const diff = new Date().getTime() - sessionTimestamp;

    return diff > olderThanMs;
  }, []);

  const checkHangingBatches = useCallback(async () => {
    for (const { batchId, transactions } of batchTransactionsArray) {
      if (!isBatchHanding(batchId, TRANSACTIONS_STATUS_DROP_INTERVAL_MS)) {
        continue;
      }

      const sessionId = batchId.split('-')[0];
      if (!sessionId) {
        continue;
      }

      await updateBatch({
        batchId,
        shouldRefreshBalance: true,
        dropUnprocessedTransactions: true
      });

      const batchTransactionsArray = sequentialToFlatArray({ transactions });

      const { isPending } = getTransactionsStatus({
        transactions: batchTransactionsArray
      });

      if (!isPending) {
        removeBatchTransactions(batchId);
      }
    }
  }, [isBatchHanding, batchTransactionsArray, updateBatch]);

  useEffect(() => {
    const interval = setInterval(async () => {
      checkHangingBatches();
    }, AVERAGE_TX_DURATION_MS);

    return () => clearInterval(interval);
  }, [checkHangingBatches]);
};
