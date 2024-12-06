import { Address } from '@multiversx/sdk-core';
import BigNumber from 'bignumber.js';
import { TransactionTypesEnum } from 'types/enums.types';
import { addressIsValid } from 'utils/account/addressIsValid';
import { decodePart } from 'utils/decoders/decodePart';

const noData = {
  tokenId: '',
  amount: ''
};

export const decodeData = (data: string) => {
  const nonceIndex = 2;
  const amountIndex = 3;
  const parts = data.split('@');
  const decodedParts = parts.map((part, i) =>
    [nonceIndex, amountIndex].includes(i) ? part : decodePart(part)
  );
  return decodedParts;
};

export function getTokenFromData(data?: string): {
  tokenId: string;
  amount: string;
  collection?: string;
  nonce?: string;
  receiver?: string;
} {
  if (!data) {
    return noData;
  }

  const isTokenTransfer = data.startsWith(TransactionTypesEnum.ESDTTransfer);
  const isNftTransfer =
    data.startsWith(TransactionTypesEnum.ESDTNFTTransfer) && data.includes('@');
  const isNftBurn =
    data.startsWith(TransactionTypesEnum.ESDTNFTBurn) && data.includes('@');

  if (isTokenTransfer) {
    const [, encodedToken, encodedAmount] = data.split('@');
    try {
      const tokenId = Buffer.from(encodedToken, 'hex').toString('ascii');

      if (!tokenId) {
        return noData;
      }

      const amount = new BigNumber(
        '0x' + encodedAmount.replace('0x', '')
      ).toString(10);

      return {
        tokenId,
        amount
      };
    } catch (e) {
      console.error('Error getting token from transaction data', e);
    }
  }

  if (isNftTransfer) {
    try {
      const [, /*ESDTNFTTransfer*/ collection, nonce, quantity, receiver] =
        decodeData(data);
      if (
        [collection, nonce, quantity, receiver].every((el) => Boolean(el)) &&
        addressIsValid(Address.newFromHex(receiver).toBech32())
      ) {
        return {
          tokenId: `${collection}-${nonce}`,
          amount: new BigNumber(quantity, 16).toString(10),
          collection,
          nonce,
          receiver: Address.newFromHex(receiver).toBech32()
        };
      }
    } catch (err) {}
  }

  if (isNftBurn) {
    try {
      const [, /*ESDTNFTBurn*/ collection, nonce, quantity] = decodeData(data);
      if ([collection, nonce, quantity].every((el) => Boolean(el))) {
        return {
          tokenId: `${collection}-${nonce}`,
          amount: new BigNumber(quantity, 16).toString(10),
          collection,
          nonce
        };
      }
    } catch (err) {}
  }

  return noData;
}
