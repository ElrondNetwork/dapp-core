import * as React from 'react';
import TransactionRow from './TransactionRow';
import { parseTransactions } from 'components/TransactionsInterpreter/TransactionsInterpreter';
import { UITransactionType } from 'components/TransactionsInterpreter/helpers/types';

export type TransactionType = UITransactionType;

interface TransactionsTableType {
  transactions: TransactionType[];
  address?: string;
  totalTransactions: number | '...';
  size: number;
  title?: React.ReactNode;
  directionCol?: boolean;
  showLockedAccounts?: boolean;
}

export const TransactionsTable = ({
  transactions,
  address,
  title = (
    <>
      <h6 data-testid='title'>Transactions</h6>
    </>
  ),
  directionCol = false,
  showLockedAccounts = false
}: TransactionsTableType) => {
  if (!address) {
    console.error('Invalid account');
    return null;
  }

  const processedTransactions = parseTransactions(transactions, address);

  return (
    <div className='transactions-table'>
      <div className='card'>
        <div className='card-header'>
          <div className='card-header-item d-flex justify-content-between align-items-center'>
            <div>{title}</div>
          </div>
        </div>
        <div className='card-body p-0'>
          <div className='table-wrapper animated-list'>
            <table
              className='table trim-size-sm'
              data-testid='transactionsTable'
            >
              <thead>
                <tr>
                  <th scope='col'>Txn Hash</th>
                  <th scope='col'>Age</th>
                  <th scope='col'>Shard</th>
                  <th scope='col'>From</th>
                  {directionCol && <th scope='col' />}
                  <th scope='col'>To</th>
                  <th scope='col'>Method</th>
                  <th scope='col'>Value</th>
                </tr>
              </thead>
              <tbody>
                {processedTransactions.map((transaction) => (
                  <TransactionRow
                    transaction={transaction}
                    key={transaction.txHash}
                    showDirectionCol={directionCol}
                    showLockedAccounts={showLockedAccounts}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
