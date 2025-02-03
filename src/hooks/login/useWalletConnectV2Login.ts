import { useEffect, useRef, useState } from 'react';

import { useGetAccountProvider } from 'hooks/account';
import { useUpdateEffect } from 'hooks/useUpdateEffect';
import { setAccountProvider } from 'providers/accountProvider';
import { emptyProvider, getProviderType } from 'providers/utils';
import { loginAction } from 'reduxStore/commonActions';
import { useDispatch, useSelector } from 'reduxStore/DappProviderContext';
import { loginMethodSelector, logoutRouteSelector } from 'reduxStore/selectors';
import {
  walletConnectDeepLinkSelector,
  walletConnectV2OptionsSelector,
  walletConnectV2ProjectIdSelector,
  walletConnectV2RelaySelector
} from 'reduxStore/selectors/networkConfigSelectors';
import { setWalletConnectLogin } from 'reduxStore/slices';
import { LoginMethodsEnum } from 'types/enums.types';
import { getHasNativeAuth } from 'utils/getHasNativeAuth';
import { getIsLoggedIn } from 'utils/getIsLoggedIn';
import { optionalRedirect } from 'utils/internal';
import { logout } from 'utils/logout';
import { waitForChainID } from 'utils/waitForChainID';
import {
  PairingTypes,
  SessionEventTypes,
  WalletConnectOptionalMethodsEnum,
  WalletConnectV2Provider
} from 'utils/walletconnect/__sdkWalletconnectProvider';
import { getWindowLocation } from 'utils/window/getWindowLocation';
import {
  LoginHookGenericStateType,
  OnProviderLoginType
} from '../../types/login.types';
import { clearInitiatedLogins } from './helpers';
import { useLoginService } from './useLoginService';

export enum WalletConnectV2Error {
  invalidAddress = 'Invalid address',
  invalidConfig = 'Invalid WalletConnect setup',
  invalidTopic = 'Expired connection',
  sessionExpired = 'Unable to connect to existing session',
  connectError = 'Unable to connect',
  userRejected = 'User rejected connection proposal',
  userRejectedExisting = 'User rejected existing connection proposal',
  errorLogout = 'Unable to remove existing pairing',
  invalidChainID = 'Invalid chainID'
}

export interface InitWalletConnectV2Type extends OnProviderLoginType {
  logoutRoute?: string;
  customRequestMethods?: Array<string>;
}

export interface WalletConnectV2LoginHookCustomStateType {
  uriDeepLink: string;
  cancelLogin: () => Promise<void>;
  connectExisting: (pairing: PairingTypes.Struct) => Promise<void>;
  removeExistingPairing: (topic: string) => Promise<void>;
  walletConnectUri?: string;
  wcPairings?: PairingTypes.Struct[];
}

export type WalletConnectV2LoginHookReturnType = [
  (loginProvider?: boolean) => Promise<void>,
  LoginHookGenericStateType,
  WalletConnectV2LoginHookCustomStateType
];

export const useWalletConnectV2Login = ({
  callbackRoute,
  token: tokenToSign,
  nativeAuth,
  onLoginRedirect,
  logoutRoute: providerLogoutRoute,
  customRequestMethods = []
}: InitWalletConnectV2Type): WalletConnectV2LoginHookReturnType => {
  const dispatch = useDispatch();
  const hasNativeAuth = getHasNativeAuth(nativeAuth);
  const loginService = useLoginService(hasNativeAuth ? nativeAuth : false);
  let token = tokenToSign;

  const [error, setError] = useState<string>('');
  const [wcUri, setWcUri] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [wcPairings, setWcPairings] = useState<
    PairingTypes.Struct[] | undefined
  >([]);
  const [sessionProvider, setSessionProvider] =
    useState<WalletConnectV2Provider | null>(null);
  const { provider } = useGetAccountProvider();
  const walletConnectV2RelayAddress = useSelector(walletConnectV2RelaySelector);
  const walletConnectV2ProjectId = useSelector(
    walletConnectV2ProjectIdSelector
  );

  const walletConnectV2Options = useSelector(walletConnectV2OptionsSelector);
  const walletConnectDeepLink = useSelector(walletConnectDeepLinkSelector);
  const dappLogoutRoute = useSelector(logoutRouteSelector);
  const loginMethod = useSelector(loginMethodSelector);
  const providerRef = useRef<any>(provider);
  const isInitialisingRef = useRef<boolean>(false);
  const mounted = useRef(false);
  const logoutRoute = providerLogoutRoute ?? dappLogoutRoute ?? '/';
  const dappMethods: string[] = [
    WalletConnectOptionalMethodsEnum.CANCEL_ACTION,
    ...customRequestMethods
  ];

  if (tokenToSign) {
    dappMethods.push(WalletConnectOptionalMethodsEnum.SIGN_LOGIN_TOKEN);
  }

  if (hasNativeAuth) {
    dappMethods.push(WalletConnectOptionalMethodsEnum.SIGN_NATIVE_AUTH_TOKEN);
  }

  const uriDeepLink = !isLoading
    ? `${walletConnectDeepLink}?wallet-connect=${encodeURIComponent(wcUri)}`
    : '';

  const loginFailed = Boolean(error);
  const isLoggedIn = getIsLoggedIn();

  const handleOnLogout = () => {
    logout(logoutRoute);
  };

  const handleOnEvent = (event: SessionEventTypes['event']) => {
    console.log('WalletConnect Session Event: ', event);
  };

  const handleOnLogin = async () => {
    try {
      if (isInitialisingRef.current || providerRef.current == null) {
        return;
      }

      if (!mounted.current) {
        try {
          await providerRef.current?.logout();
        } catch {
          console.warn('Unable to logout');
        }

        return;
      }

      const address = await providerRef.current?.getAddress?.();

      if (!address) {
        console.warn('Login cancelled.');
        return;
      }

      const signature = await providerRef.current?.getSignature();
      const loginActionData = {
        address: address,
        loginMethod: LoginMethodsEnum.walletconnectv2
      };

      const loginData = {
        logoutRoute: logoutRoute,
        loginType: 'walletconnectv2',
        callbackRoute: callbackRoute ?? getWindowLocation().href
      };

      dispatch(setWalletConnectLogin(loginData));

      if (signature) {
        loginService.setTokenLoginInfo({ signature, address });
      }

      dispatch(loginAction(loginActionData));
      optionalRedirect({
        callbackRoute,
        onLoginRedirect,
        options: { address, signature }
      });
    } catch (err) {
      setError(WalletConnectV2Error.userRejected);
      console.error(err);
    }
  };

  const cancelLogin = async () => {
    const providerType = getProviderType(providerRef.current);

    if (providerType !== LoginMethodsEnum.walletconnectv2) {
      return;
    }

    try {
      const connectedSessions =
        providerRef.current?.walletConnector?.session?.getAll() ?? [];

      if (connectedSessions.length > 0) {
        await providerRef.current?.logout();
      }

      providerRef.current = emptyProvider;
      setSessionProvider(null);
    } catch {
      console.warn('Unable to logout');
    }

    return;
  };

  const connectExisting = async (pairing: PairingTypes.Struct) => {
    if (!walletConnectV2RelayAddress || !walletConnectV2ProjectId) {
      setError(WalletConnectV2Error.invalidConfig);
      return;
    }

    if (!pairing || !pairing.topic) {
      setError(WalletConnectV2Error.invalidTopic);
      return;
    }

    try {
      const providerType = providerRef.current
        ? getProviderType(providerRef.current)
        : false;

      if (providerType !== LoginMethodsEnum.walletconnectv2) {
        // Prevent redirecting to wallet login hook
        await initiateLogin();

        return;
      }

      setIsLoading(true);
      await cancelLogin();

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

      await initiateLogin(false);

      const { approval } = await providerRef.current?.connect({
        topic: pairing.topic,
        methods: dappMethods
      });

      try {
        await providerRef.current?.login({ approval, token });
      } catch (err) {
        console.error(WalletConnectV2Error.userRejectedExisting, err);
        setError(WalletConnectV2Error.userRejectedExisting);
        setIsLoading(true);
        await initiateLogin();
      }
    } catch (err) {
      console.error(WalletConnectV2Error.sessionExpired, err);
      setError(WalletConnectV2Error.sessionExpired);
    } finally {
      setWcPairings(providerRef.current?.pairings);
    }
  };

  const removeExistingPairing = async (topic: string) => {
    try {
      if (topic) {
        await providerRef.current?.logout({
          topic
        });
      }
    } catch (err) {
      console.error(WalletConnectV2Error.errorLogout, err);
      setError(WalletConnectV2Error.errorLogout);
    } finally {
      const newPairings = await providerRef.current?.getPairings();
      setWcPairings(newPairings);
    }
  };

  async function initiateLogin(loginProvider = true) {
    clearInitiatedLogins();

    const chainId = await waitForChainID({ maxRetries: 15 });

    if (!chainId) {
      console.error(WalletConnectV2Error.invalidChainID);
      setError(WalletConnectV2Error.invalidChainID);
      return;
    }

    if (!walletConnectV2ProjectId || !walletConnectV2RelayAddress) {
      console.error(WalletConnectV2Error.invalidConfig);
      setError(WalletConnectV2Error.invalidConfig);
      return;
    }

    const isLoggedIn = getIsLoggedIn();
    const cannotLogin = mounted.current === false && !isLoggedIn;
    const isWalletConnectProvider =
      getProviderType(providerRef.current) === LoginMethodsEnum.walletconnectv2;

    const isInitialized =
      providerRef.current?.isInitialized?.() && isWalletConnectProvider;

    if (isInitialisingRef.current || cannotLogin || isInitialized) {
      return;
    }

    isInitialisingRef.current = true;

    if (providerRef.current?.walletConnector) {
      await providerRef.current.init();

      setSessionProvider(providerRef.current);

      isInitialisingRef.current = false;

      if (loginProvider) {
        await generateWcUri();
      }

      return;
    }

    const providerHandlers = {
      onClientLogin: handleOnLogin,
      onClientLogout: handleOnLogout,
      onClientEvent: handleOnEvent
    };

    const newProvider = new WalletConnectV2Provider(
      providerHandlers,
      chainId,
      walletConnectV2RelayAddress,
      walletConnectV2ProjectId,
      walletConnectV2Options
    );

    await newProvider.init();
    setSessionProvider(newProvider);
    providerRef.current = newProvider;
    isInitialisingRef.current = false;

    if (loginProvider) {
      setWcPairings(newProvider.pairings);
      await generateWcUri();
    }

    return;
  }

  async function generateWcUri() {
    if (!providerRef.current) {
      return;
    }

    if (!walletConnectV2RelayAddress || !walletConnectV2ProjectId) {
      setError(WalletConnectV2Error.invalidConfig);
      return;
    }

    try {
      // Do not do any other actions if component is not mounted
      if (!mounted.current) {
        return;
      }

      const { uri, approval } = await providerRef.current?.connect({
        methods: dappMethods
      });

      const hasUri = Boolean(uri);

      if (!hasUri) {
        return;
      }

      setWcUri(uri);

      if (walletConnectV2Options?.logger === 'debug') {
        console.log('WalletConnect uri: ', uri);
      }

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

      const providerType = providerRef.current
        ? getProviderType(providerRef.current)
        : false;

      if (providerType !== LoginMethodsEnum.walletconnectv2) {
        // Prevent redirecting to wallet login hook
        setIsLoading(true);
        await initiateLogin();
        return;
      }

      try {
        await providerRef.current?.login({ approval, token });
      } catch (err) {
        console.error(WalletConnectV2Error.userRejected, err);
        setError(WalletConnectV2Error.userRejected);
        setIsLoading(true);
      }
    } catch (err) {
      console.error(WalletConnectV2Error.connectError, err);
    }
  }

  useUpdateEffect(() => {
    providerRef.current = provider;
  }, [provider]);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    setIsLoading(!wcUri);
  }, [wcUri]);

  useEffect(() => {
    if (!sessionProvider) {
      return;
    }

    // Check if a new session has been created is already connected
    const isConnected =
      Boolean(sessionProvider.session) ||
      loginMethod === LoginMethodsEnum.walletconnectv2;

    // Set new provider only if account is logged in and if walletConnect session is available
    if (isConnected && isLoggedIn) {
      setAccountProvider(sessionProvider);
    }
  }, [sessionProvider, isLoggedIn]);

  return [
    initiateLogin,
    {
      error,
      loginFailed,
      isLoading: isLoading && !loginFailed,
      isLoggedIn: isLoggedIn && !loginFailed
    },
    {
      uriDeepLink,
      walletConnectUri: wcUri,
      cancelLogin,
      connectExisting,
      removeExistingPairing,
      wcPairings
    }
  ];
};
