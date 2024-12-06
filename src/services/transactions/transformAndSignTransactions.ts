import { Address, Transaction } from '@multiversx/sdk-core';
import BigNumber from 'bignumber.js';

import {
  EXTRA_GAS_LIMIT_GUARDED_TX,
  GAS_LIMIT,
  GAS_PER_DATA_BYTE,
  GAS_PRICE
} from 'constants/index';
import { newTransaction } from 'models/newTransaction';
import { addressSelector, chainIDSelector } from 'reduxStore/selectors';
import { store } from 'reduxStore/store';
import { SendSimpleTransactionPropsType } from 'types';

import { getAccount } from 'utils/account/getAccount';
import { getLatestNonce } from 'utils/account/getLatestNonce';
import { computeTransactionNonce } from './computeTransactionNonce';

enum ErrorCodesEnum {
  'invalidReceiver' = 'Invalid Receiver address',
  'unknownError' = 'Unknown Error. Please check the transactions and try again'
}

function calculateGasLimit({
  data,
  isGuarded
}: {
  data?: string;
  isGuarded?: boolean;
}) {
  const guardedAccountGasLimit = isGuarded ? EXTRA_GAS_LIMIT_GUARDED_TX : 0;
  const bNconfigGasLimit = new BigNumber(GAS_LIMIT).plus(
    guardedAccountGasLimit
  );
  const bNgasPerDataByte = new BigNumber(GAS_PER_DATA_BYTE);
  const bNgasValue = data
    ? bNgasPerDataByte.times(Buffer.from(data).length)
    : 0;
  const bNgasLimit = bNconfigGasLimit.plus(bNgasValue);
  const gasLimit = bNgasLimit.toString(10);
  return gasLimit;
}

export async function transformAndSignTransactions({
  transactions
}: SendSimpleTransactionPropsType): Promise<Transaction[]> {
  const address = addressSelector(store.getState());
  const account = await getAccount(address);
  const accountNonce = getLatestNonce(account);
  return transactions.map((tx) => {
    const {
      value,
      receiver,
      data = '',
      chainID,
      version = 1,
      options,
      gasPrice = GAS_PRICE,
      gasLimit = calculateGasLimit({
        data: tx.data,
        isGuarded: account?.isGuarded
      }),
      guardian,
      guardianSignature,
      nonce: transactionNonce = 0
    } = tx;
    let validatedReceiver = receiver;

    try {
      const addr = Address.newFromBech32(receiver);
      validatedReceiver = addr.hex();
    } catch (err) {
      throw ErrorCodesEnum.invalidReceiver;
    }

    const computedNonce = computeTransactionNonce({
      accountNonce,
      transactionNonce
    });

    const storeChainId = chainIDSelector(store.getState()).valueOf().toString();
    const transactionsChainId = chainID || storeChainId;
    return newTransaction({
      value,
      receiver: validatedReceiver,
      data,
      gasPrice,
      gasLimit: Number(gasLimit),
      nonce: Number(computedNonce.valueOf().toString()),
      sender: Address.newFromBech32(address).hex(),
      chainID: transactionsChainId,
      version,
      options,
      guardian,
      guardianSignature
    });
  });
}
