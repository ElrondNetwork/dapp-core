import { useEffect, useMemo, useState } from 'react';
import { Address } from '@multiversx/sdk-core/out';
import { getServerConfiguration } from 'apiCalls';
import { fallbackNetworkConfigurations } from 'constants/network';
import { useGetAccountInfo } from 'hooks/account/useGetAccountInfo';
import { useDispatch, useSelector } from 'reduxStore/DappProviderContext';
import { isLoginSessionInvalidSelector } from 'reduxStore/selectors/loginInfoSelectors';
import { setDappConfig } from 'reduxStore/slices';
import { setLogoutRoute } from 'reduxStore/slices/loginInfoSlice';
import {
  defaultNetwork,
  initializeNetworkConfig
} from 'reduxStore/slices/networkConfigSlice';
import { logout } from 'utils/logout';
import {
  CustomNetworkType,
  DappConfigType,
  IDappProvider,
  EnvironmentsEnum,
  NetworkType
} from '../types';

export interface UseAppInitializerPropsType {
  customNetworkConfig?: CustomNetworkType;
  externalProvider?: IDappProvider;
  environment: 'testnet' | 'mainnet' | 'devnet' | EnvironmentsEnum | string;
  dappConfig?: DappConfigType;
}

export interface AppInitializerPropsType extends UseAppInitializerPropsType {
  children?: any;
}

export const useAppInitializer = ({
  customNetworkConfig = {},
  environment,
  dappConfig
}: UseAppInitializerPropsType) => {
  const [initialized, setInitialized] = useState(false);
  const account = useGetAccountInfo();
  const isLoginSessionInvalid = useSelector(isLoginSessionInvalidSelector);

  // memoize dappConfig to avoid rerendering of AppInitializer
  const memoizedDappConfig = useMemo(() => dappConfig, []);
  const logoutRoute = memoizedDappConfig?.logoutRoute;

  const { address, publicKey } = account;
  const dispatch = useDispatch();

  async function initializeNetwork() {
    const fetchConfigFromServer = !customNetworkConfig?.skipFetchFromServer;
    const customNetworkApiAddress = customNetworkConfig?.apiAddress;

    const isFoundEnv = environment in fallbackNetworkConfigurations;

    const fallbackConfig: NetworkType | Record<string, string> = isFoundEnv
      ? fallbackNetworkConfigurations[environment as EnvironmentsEnum]
      : {};

    const baseConfig = {
      ...defaultNetwork,
      ...fallbackConfig,
      ...customNetworkConfig
    };

    const localConfig: NetworkType = {
      ...baseConfig,
      apiTimeout: String(baseConfig.apiTimeout),
      walletConnectBridgeAddresses:
        baseConfig.walletConnectBridgeAddresses || [],
      walletConnectV2RelayAddresses:
        'walletConnectV2RelayAddresses' in baseConfig
          ? baseConfig.walletConnectV2RelayAddresses
          : ['wss://relay.walletconnect.com']
    };

    if (fetchConfigFromServer) {
      const fallbackApiAddress =
        'apiAddress' in fallbackConfig ? fallbackConfig.apiAddress : '';

      const serverConfig = await getServerConfiguration(
        customNetworkApiAddress || fallbackApiAddress
      );

      if (serverConfig != null) {
        const apiConfig = {
          ...localConfig,
          ...serverConfig,
          ...customNetworkConfig
        };
        dispatch(
          initializeNetworkConfig({
            ...apiConfig,
            apiTimeout: String(apiConfig.apiTimeout)
          })
        );
        return;
      }
    }

    dispatch(initializeNetworkConfig(localConfig));
  }

  async function initializeApp() {
    if (memoizedDappConfig) {
      dispatch(setDappConfig(memoizedDappConfig));
    }
    dispatch(setLogoutRoute(logoutRoute));
    await initializeNetwork();

    setInitialized(true);
  }

  useEffect(() => {
    if (address) {
      const pubKey = Address.newFromBech32(address).hex();
      if (pubKey !== publicKey) {
        logout(logoutRoute);
      }
    }
  }, [address, publicKey, logoutRoute]);

  useEffect(() => {
    initializeApp();
  }, [customNetworkConfig, environment, memoizedDappConfig]);

  useEffect(() => {
    if (account.address && isLoginSessionInvalid) {
      logout(logoutRoute);
    }
  }, [isLoginSessionInvalid, account.address, logoutRoute]);

  return { initialized };
};

export function AppInitializer({
  customNetworkConfig = {},
  children,
  environment,
  dappConfig
}: AppInitializerPropsType) {
  const [isBrowser, setIsBrowser] = useState(!dappConfig?.isSSR);

  const { initialized } = useAppInitializer({
    customNetworkConfig,
    environment,
    dappConfig
  });

  // This is a hack to allow the app to render on the server side
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  return isBrowser ? (initialized ? children : null) : children;
}
