import { Message, Address } from '@multiversx/sdk-core';
import { CrossWindowProvider } from 'lib/sdkWebWalletCrossWindowProvider';
import { getAccountProvider, getProviderType } from 'providers';
import { LoginMethodsEnum } from 'types';
import { getAddress } from 'utils/account/getAddress';
import { addOriginToLocationPath } from 'utils/window';

export interface SignMessageType {
  message: string;
  callbackRoute?: string;
  options?: {
    hasConsentPopup?: boolean;
  };
}

export const signMessage = async ({
  message,
  callbackRoute,
  options
}: SignMessageType) => {
  const address = await getAddress();
  const provider = getAccountProvider();
  const providerType = getProviderType(provider);

  const callbackUrl = addOriginToLocationPath(callbackRoute);

  const signableMessage = new Message({
    address: Address.newFromBech32(address),
    data: Buffer.from(message)
  });

  if (
    options?.hasConsentPopup &&
    providerType === LoginMethodsEnum.crossWindow
  ) {
    (provider as unknown as CrossWindowProvider).setShouldShowConsentPopup(
      true
    );
  }

  const signedMessage = await provider.signMessage(signableMessage, {
    callbackUrl: encodeURIComponent(callbackUrl)
  });

  return signedMessage;
};
