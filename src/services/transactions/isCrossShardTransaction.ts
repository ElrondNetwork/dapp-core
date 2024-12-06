import { Address } from '@multiversx/sdk-core/out';

import { getShardOfAddress } from 'utils/account/getShardOfAddress';

export interface IsCrossShardTransactionPropsType {
  receiverAddress: string;
  senderShard?: number;
  senderAddress?: string;
}
export function isCrossShardTransaction({
  receiverAddress,
  senderShard,
  senderAddress
}: IsCrossShardTransactionPropsType) {
  try {
    const receiver = Address.newFromBech32(receiverAddress);
    const receiverShard = getShardOfAddress(receiver.pubkey());
    if (senderShard == null && senderAddress != null) {
      const sender = Address.newFromBech32(senderAddress);
      return getShardOfAddress(sender) === receiverShard;
    }
    return receiverShard === senderShard;
  } catch (err) {
    return false;
  }
}
