import { useState } from 'react';
import { processModifiedAccount } from 'components/ProviderInitializer/helpers/processModifiedAccount';
import { isBrowserWithPopupConfirmation } from 'constants/browser';
import { SECOND_LOGIN_ATTEMPT_ERROR } from 'constants/errorsMessages';
import { CrossWindowProvider } from 'lib/sdkWebWalletCrossWindowProvider';
import { setAccountProvider } from 'providers/accountProvider';
import { loginAction } from 'reduxStore/commonActions';
import { useDispatch, useSelector } from 'reduxStore/DappProviderContext';
import { networkSelector } from 'reduxStore/selectors/networkConfigSelectors';
import { setAccount, setAddress } from 'reduxStore/slices';
import {
  InitiateLoginFunctionType,
  LoginHookGenericStateType,
  OnProviderLoginType
} from 'types';
import { LoginMethodsEnum } from 'types/enums.types';
import { getLatestNonce } from 'utils/account/getLatestNonce';
import { getIsLoggedIn } from 'utils/getIsLoggedIn';
import { optionalRedirect } from 'utils/internal';
import { getWindowLocation } from 'utils/window/getWindowLocation';
import { clearInitiatedLogins } from './helpers';
import { useLoginService } from './useLoginService';

export type UseCrossWindowLoginReturnType = [
  InitiateLoginFunctionType,
  LoginHookGenericStateType
];

export const useCrossWindowLogin = ({
  callbackRoute,
  token: tokenToSign,
  nativeAuth,
  onLoginRedirect,
  hasConsentPopup,
  walletAddress
}: OnProviderLoginType & {
  hasConsentPopup?: boolean;
  walletAddress?: string;
}): UseCrossWindowLoginReturnType => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const hasNativeAuth = nativeAuth != null;
  const loginService = useLoginService(nativeAuth);
  let token = tokenToSign;
  const network = useSelector(networkSelector);

  const dispatch = useDispatch();
  const isLoggedIn = getIsLoggedIn();

  async function initiateLogin() {
    if (isLoggedIn) {
      throw new Error(SECOND_LOGIN_ATTEMPT_ERROR);
    }

    clearInitiatedLogins({
      skipLoginMethod: LoginMethodsEnum.crossWindow
    });

    setIsLoading(true);
    const isSuccessfullyInitialized: boolean =
      await CrossWindowProvider.getInstance().init();

    const provider: CrossWindowProvider =
      CrossWindowProvider.getInstance().setWalletUrl(
        walletAddress ?? network.walletAddress
      );

    try {
      if (!isSuccessfullyInitialized) {
        console.warn(
          'Something went wrong trying to redirect to wallet login..'
        );
        return;
      }

      const { origin, pathname } = getWindowLocation();
      const callbackUrl: string = encodeURIComponent(
        `${origin}${callbackRoute ?? pathname}`
      );

      if (hasNativeAuth && !token) {
        token = await loginService.getNativeAuthLoginToken();

        // Fetching block failed
        if (!token) {
          console.warn('Fetching block failed. Login cancelled.');
          return;
        }
      }

      if (token) {
        loginService.setLoginToken(token);
      }

      const providerLoginData = {
        callbackUrl,
        ...(token && { token })
      };

      const needsConsent = isBrowserWithPopupConfirmation && hasNativeAuth;

      if (needsConsent || hasConsentPopup) {
        provider.setShouldShowConsentPopup(true);
      }

      const { signature, address, multisig, impersonate } =
        await provider.login(providerLoginData);

      if (!address) {
        setIsLoading(false);
        // Reset the `CrossWindowProvider` if the login failed
        await CrossWindowProvider.getInstance().dispose();
        console.warn('Login cancelled.');
        return;
      }

      setAccountProvider(provider);

      const account = await processModifiedAccount({
        loginToken: token,
        extraInfoData: { multisig, impersonate },
        address,
        signature,
        loginService
      });

      if (!account) {
        return;
      }

      dispatch(
        loginAction({
          address: account.address,
          loginMethod: LoginMethodsEnum.crossWindow
        })
      );

      dispatch(setAddress(account.address));

      dispatch(
        setAccount({
          ...account,
          nonce: getLatestNonce(account)
        })
      );

      optionalRedirect({
        callbackRoute,
        onLoginRedirect,
        options: { signature, address: account.address }
      });
    } catch (error) {
      console.error('error loging in', error);
      // TODO: can be any or typed error
      setError('error logging in' + (error as any).message);
    } finally {
      setIsLoading(false);
    }
  }

  const loginFailed = Boolean(error);

  return [
    initiateLogin,
    {
      loginFailed,
      error,
      isLoading: isLoading && !loginFailed,
      isLoggedIn: isLoggedIn && !loginFailed
    }
  ];
};
