import { refreshAccount } from 'utils/account/refreshAccount';
import { useGetBatchesTransactions } from './useGetBatchesTransactions';
import { BatchTransactionStatus, CustomTransactionInformation } from 'types';
import { checkSequentialTransactionsStatuses } from 'utils/transactions/batch/checkSequentialTransactionsStatuses';

export function useCheckBatchesTransactionsStatuses() {
  const { batches, batchTransactionsArray } = useGetBatchesTransactions();

  async function checkBatchesTransactionsStatuses(props?: {
    shouldRefreshBalance?: boolean;
    customTransactionInformation?: CustomTransactionInformation;
  }) {
    const pendingBatches = batchTransactionsArray.filter((batch) => {
      const isPending =
        batch.batchId != null &&
        batches[batch.batchId].status === BatchTransactionStatus.pending;
      return isPending;
    });

    if (pendingBatches.length === 0) {
      return;
    }

    for (const { batchId, transactions } of pendingBatches) {
      const [sessionId] = batchId.split('-');

      await checkSequentialTransactionsStatuses({
        sessionId,
        transactions,
        customTransactionInformation: props?.customTransactionInformation
      });
    }

    if (props?.shouldRefreshBalance) {
      refreshAccount();
    }
  }

  return checkBatchesTransactionsStatuses;
}
