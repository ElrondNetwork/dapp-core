import { useGetTransactionDisplayInfo } from 'hooks';
import { useSelector } from 'reduxStore/DappProviderContext';
import { shardSelector } from 'reduxStore/selectors';
import { useEffect, useMemo } from 'react';
import {
  getAreTransactionsOnSameShard,
  getIsTransactionPending,
  getIsTransactionTimedOut,
  getUnixTimestamp,
  getUnixTimestampWithAddedMilliseconds
} from 'utils';
import { getToastDataStateByStatus } from '../utils';
import { getGeneratedClasses } from 'UI/utils';
import styles from '../styles.scss';
import { TransactionToastDefaultProps } from '../types';

const AVERAGE_TX_DURATION_MS = 6000;
const CROSS_SHARD_ROUNDS = 5;

export const useTransactionToast = ({
  toastId,
  transactions,
  status,
  lifetimeAfterSuccess,
  startTimestamp,
  endTimeProgress,
  className = 'dApp-transaction-toast',
  shouldRenderDefaultCss = true,
  onDelete
}: TransactionToastDefaultProps) => {
  const transactionDisplayInfo = useGetTransactionDisplayInfo(toastId);
  const accountShard = useSelector(shardSelector);

  const areSameShardTransactions = useMemo(
    () => getAreTransactionsOnSameShard(transactions, accountShard),
    [transactions, accountShard]
  );

  const shardAdjustedDuration = areSameShardTransactions
    ? AVERAGE_TX_DURATION_MS
    : CROSS_SHARD_ROUNDS * AVERAGE_TX_DURATION_MS;

  const transactionDuration =
    transactionDisplayInfo?.transactionDuration || shardAdjustedDuration;

  const [startTime, endTime] = useMemo(() => {
    const startTime = startTimestamp || getUnixTimestamp();
    const endTime =
      endTimeProgress ||
      getUnixTimestampWithAddedMilliseconds(transactionDuration);

    return [startTime, endTime];
  }, []);

  const progress = { startTime, endTime };
  const style = getGeneratedClasses(className, shouldRenderDefaultCss, {
    ...styles
  });

  const isPending = getIsTransactionPending(status);
  const isTimedOut = getIsTransactionTimedOut(status);

  const toastDataState = getToastDataStateByStatus({
    status,
    toastId,
    style,
    transactionDisplayInfo
  });

  const handleDeleteToast = () => {
    onDelete?.(toastId);
  };

  useEffect(() => {
    if (status !== 'success' || !lifetimeAfterSuccess) {
      return;
    }

    const timeout = setTimeout(() => {
      handleDeleteToast();
    }, lifetimeAfterSuccess);

    return () => {
      clearTimeout(timeout);
    };
  }, [lifetimeAfterSuccess, status]);

  return {
    progress,
    isPending,
    isTimedOut,
    toastDataState,
    style,
    handleDeleteToast
  };
};
