import React from 'react';
import { InterpretedTransactionType } from 'types/serverTransactions.types';
import { DetailItem } from '../../DetailItem';

export const TransactionInfoGasLimit = ({
  transaction
}: {
  transaction: InterpretedTransactionType;
}) => {
  return (
    <DetailItem title='Gas Limit'>
      {transaction.gasLimit != null ? (
        <>{transaction.gasLimit.toLocaleString('en')}</>
      ) : (
        <span className='text-secondary'>N/A</span>
      )}
    </DetailItem>
  );
};
