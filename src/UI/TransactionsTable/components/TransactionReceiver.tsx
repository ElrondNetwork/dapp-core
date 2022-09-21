import React from 'react';
import classNames from 'classnames';

import {
  InterpretedTransactionType,
  TransactionDirectionEnum
} from 'types/serverTransactions.types';
import { ExplorerLink } from 'UI/ExplorerLink';
import { AccountName } from './AccountName';
import { LockedTokenAddressIcon } from './LockedTokenAddressIcon';
import { ScAddressIcon } from './ScAddressIcon';

import globalStyles from 'assets/sass/main.scss';
import styles from './transactionsTable.styles.scss';

interface TransactionReceiverPropsTypes {
  transaction: InterpretedTransactionType;
  showLockedAccounts?: boolean;
}

export const TransactionReceiver = (props: TransactionReceiverPropsTypes) => {
  const { transaction, showLockedAccounts } = props;

  const directionIn =
    transaction.transactionDetails.direction === TransactionDirectionEnum.IN;

  return (
    <div
      className={classNames(
        globalStyles.dFlex,
        globalStyles.alignItemsCenter,
        styles.transactionCell
      )}
      data-testid='transactionReceiver'
    >
      {showLockedAccounts && (
        <LockedTokenAddressIcon
          address={transaction.receiver}
          tokenId={transaction.tokenIdentifier ?? ''}
        />
      )}

      <ScAddressIcon initiator={transaction.receiver} />

      {directionIn ? (
        <AccountName
          address={transaction.receiver}
          assets={transaction.receiverAssets}
        />
      ) : (
        <ExplorerLink
          page={transaction.links.receiverLink ?? ''}
          data-testid='receiverLink'
          className={classNames(
            globalStyles.trimWrapper,
            styles.transactionCellMargin
          )}
        >
          <AccountName
            address={transaction.receiver}
            assets={transaction.receiverAssets}
          />
        </ExplorerLink>
      )}
    </div>
  );
};
