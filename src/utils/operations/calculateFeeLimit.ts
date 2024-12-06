import {
  Transaction,
  TransactionPayload,
  TransactionVersion,
  Address,
  TokenPayment
} from '@multiversx/sdk-core';
import BigNumber from 'bignumber.js';
import {
  EXTRA_GAS_LIMIT_GUARDED_TX,
  GAS_LIMIT,
  GAS_PRICE,
  ZERO
} from 'constants/index';
import { isGuardianTx } from 'utils/transactions/isGuardianTx';
import { stringIsFloat, stringIsInteger } from 'utils/validation';

export interface CalculateFeeLimitType {
  gasLimit: string;
  gasPrice: string;
  data: string;
  gasPerDataByte: string;
  gasPriceModifier: string;
  chainId: string;
  minGasLimit?: string;
  defaultGasPrice?: string;
}
const placeholderData = {
  from: 'erd12dnfhej64s6c56ka369gkyj3hwv5ms0y5rxgsk2k7hkd2vuk7rvqxkalsa',
  to: 'erd12dnfhej64s6c56ka369gkyj3hwv5ms0y5rxgsk2k7hkd2vuk7rvqxkalsa'
};
export function calculateFeeLimit({
  minGasLimit = String(GAS_LIMIT),
  gasLimit,
  gasPrice,
  data: inputData,
  gasPerDataByte,
  gasPriceModifier,
  defaultGasPrice = String(GAS_PRICE),
  chainId
}: CalculateFeeLimitType) {
  const data = inputData || '';
  const validGasLimit = stringIsInteger(gasLimit) ? gasLimit : minGasLimit;

  // We need to add extra gas fee for guardian transactions
  const extraGasLimit = isGuardianTx({ data }) ? EXTRA_GAS_LIMIT_GUARDED_TX : 0;
  const usedGasLimit = new BigNumber(validGasLimit)
    .plus(extraGasLimit)
    .toNumber();

  const validGasPrice = stringIsFloat(gasPrice) ? gasPrice : defaultGasPrice;
  const transaction = new Transaction({
    nonce: 0,
    value: TokenPayment.egldFromAmount('0'),
    receiver: Address.newFromBech32(placeholderData.to),
    sender: Address.newFromBech32(placeholderData.to),
    gasPrice: parseInt(validGasPrice),
    gasLimit: usedGasLimit,
    data: new TransactionPayload(data.trim()),
    chainID: chainId,
    version: new TransactionVersion(1)
  });

  try {
    const bNfee = transaction.computeFee({
      GasPerDataByte: parseInt(gasPerDataByte),
      MinGasLimit: parseInt(minGasLimit),
      GasPriceModifier: parseFloat(gasPriceModifier),
      ChainID: chainId
    });
    return bNfee.toString(10);
  } catch (err) {
    console.error(err);
    return ZERO;
  }
}
