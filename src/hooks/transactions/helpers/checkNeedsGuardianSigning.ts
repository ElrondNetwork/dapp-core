import { Transaction } from '@multiversx/sdk-core';
import { getEnvironmentForChainId } from 'apiCalls/configuration';
import { getCrossWindowProvider } from 'components/ProviderInitializer/helpers';
import {
  WALLET_SIGN_SESSION,
  fallbackNetworkConfigurations
} from 'constants/index';

import { newWalletProvider } from 'providers/utils';
import { builtCallbackUrl } from 'utils/transactions/builtCallbackUrl';
import { getWindowLocation } from 'utils/window/getWindowLocation';
import { getAreAllTransactionsSignedByGuardian } from './getAreAllTransactionsSignedByGuardian';

interface SendTransactionsToGuardianType {
  transactions: Transaction[];
  hasGuardianScreen?: boolean;
  isGuarded?: boolean;
  callbackRoute?: string;
  sessionId?: string;
  walletAddress?: string;
}

export const checkNeedsGuardianSigning = ({
  transactions,
  hasGuardianScreen,
  callbackRoute,
  sessionId,
  walletAddress,
  isGuarded
}: SendTransactionsToGuardianType) => {
  const allSignedByGuardian = getAreAllTransactionsSignedByGuardian({
    isGuarded,
    transactions
  });

  const chainId = transactions[0].getChainID().valueOf();
  const sender = transactions[0].sender;
  const environment = getEnvironmentForChainId(chainId);
  const walletProviderAddress =
    walletAddress ?? fallbackNetworkConfigurations[environment].walletAddress;

  const sendTransactionsToGuardian = () => {
    const walletProvider = newWalletProvider(walletProviderAddress);
    const urlParams = { [WALLET_SIGN_SESSION]: String(sessionId) };
    const { origin } = getWindowLocation();
    const callbackUrl = window?.location
      ? `${origin}${callbackRoute}`
      : `${callbackRoute}`;
    const builtedCallbackUrl = builtCallbackUrl({ callbackUrl, urlParams });

    walletProvider.guardTransactions(transactions, {
      callbackUrl: encodeURIComponent(builtedCallbackUrl)
    });
  };

  const guardTransactions = async () => {
    const provider = await getCrossWindowProvider({
      address: sender,
      walletUrl: walletProviderAddress
    });
    provider?.setShouldShowConsentPopup(true);
    const guardedTransactions = await provider?.guardTransactions(transactions);
    return guardedTransactions;
  };

  const needs2FaSigning =
    !hasGuardianScreen && !allSignedByGuardian && sessionId;

  return {
    needs2FaSigning: isGuarded ? needs2FaSigning : false,
    sendTransactionsToGuardian,
    guardTransactions
  };
};
