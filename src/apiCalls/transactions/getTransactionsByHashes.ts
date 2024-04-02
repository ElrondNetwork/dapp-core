import { apiAddressSelector } from 'reduxStore/selectors';
import { store } from 'reduxStore/store';
import {
  GetTransactionsByHashesReturnType,
  PendingTransactionsType
} from 'types/transactions.types';
import { axiosInstance } from '../utils';

export const getTransactionsByHashes = async (
  pendingTransactions: PendingTransactionsType
): Promise<GetTransactionsByHashesReturnType> => {
  const apiAddress = apiAddressSelector(store.getState());
  const hashes = pendingTransactions.map((tx) => tx.hash);
  const { data: responseData } = await axiosInstance.get(
    `${apiAddress}/transactions`,
    {
      params: {
        hashes: hashes.join(','),
        withScResults: true
      }
    }
  );

  return pendingTransactions.map(({ hash, previousStatus }) => {
    const txOnNetwork = responseData.find(
      (txResponse: any) => txResponse?.txHash === hash
    );

    return {
      hash,
      data: txOnNetwork?.data,
      invalidTransaction: txOnNetwork == null,
      status: txOnNetwork?.status,
      results: txOnNetwork?.results,
      sender: txOnNetwork?.sender,
      receiver: txOnNetwork?.receiver,
      previousStatus,
      hasStatusChanged: txOnNetwork && txOnNetwork.status !== previousStatus
    };
  });
};

export const getTransactionByHashPromise = (hash: string) => {
  const apiAddress = apiAddressSelector(store.getState());

  return axiosInstance.get(`${apiAddress}/transactions/${hash}`, {
    timeout: 10000 // 10sec
  });
};
