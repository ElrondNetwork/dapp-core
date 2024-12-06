import {
  Address,
  Transaction,
  TransactionOptions,
  TransactionVersion
} from '@multiversx/sdk-core';
import { GAS_LIMIT, GAS_PRICE, VERSION } from 'constants/index';
import { RawTransactionType } from 'types';
import { getDataPayloadForTransaction } from 'utils/transactions/getDataPayloadForTransaction';
import { isGuardianTx } from 'utils/transactions/isGuardianTx';

export function newTransaction(rawTransaction: RawTransactionType) {
  const rawTx = { ...rawTransaction };

  // TODO: Remove when the protocol supports usernames for guardian transactions
  if (isGuardianTx({ data: rawTx.data, onlySetGuardian: true })) {
    delete rawTx.senderUsername;
    delete rawTx.receiverUsername;
  }

  const transaction = new Transaction({
    value: rawTx.value.valueOf(),
    data: getDataPayloadForTransaction(rawTx.data),
    nonce: rawTx.nonce.valueOf(),
    receiver: Address.newFromBech32(rawTx.receiver),
    ...(rawTx.receiverUsername
      ? { receiverUsername: rawTx.receiverUsername }
      : {}),
    sender: Address.newFromBech32(rawTx.sender),
    ...(rawTx.senderUsername ? { senderUsername: rawTx.senderUsername } : {}),
    gasLimit: rawTx.gasLimit.valueOf() ?? GAS_LIMIT,
    gasPrice: rawTx.gasPrice.valueOf() ?? GAS_PRICE,
    chainID: rawTx.chainID.valueOf(),
    version: new TransactionVersion(rawTx.version ?? VERSION),
    ...(rawTx.options
      ? { options: new TransactionOptions(rawTx.options) }
      : {}),
    ...(rawTx.guardian
      ? { guardian: Address.newFromBech32(rawTx.guardian) }
      : {})
  });

  if (rawTx.guardianSignature) {
    transaction.applyGuardianSignature(
      Buffer.from(rawTx.guardianSignature, 'hex')
    );
  }

  if (rawTx.signature) {
    transaction.applySignature(Buffer.from(rawTx.signature, 'hex'));
  }

  return transaction;
}
