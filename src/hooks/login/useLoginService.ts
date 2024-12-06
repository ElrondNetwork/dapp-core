import { useRef } from 'react';
import { Address, Message } from '@multiversx/sdk-core';
import { useGetAccount } from 'hooks/account';
import { useDispatch, useSelector } from 'reduxStore/DappProviderContext';
import { networkSelector, tokenLoginSelector } from 'reduxStore/selectors';
import { setTokenLogin } from 'reduxStore/slices';
import { nativeAuth } from 'services/nativeAuth';
import { getNativeAuthConfig } from 'services/nativeAuth/methods';
import { NativeAuthConfigType, OnProviderLoginType } from 'types';

const getApiAddress = (
  apiAddress: string,
  config?: OnProviderLoginType['nativeAuth']
) => {
  if (!config) {
    return null;
  }
  if (config === true) {
    return apiAddress;
  }
  return config.apiAddress ?? apiAddress;
};

export const useLoginService = (config?: OnProviderLoginType['nativeAuth']) => {
  const network = useSelector(networkSelector);
  const tokenLogin = useSelector(tokenLoginSelector);
  const tokenRef = useRef(tokenLogin?.loginToken);

  const apiAddress = getApiAddress(network.apiAddress, config);

  const configuration = getNativeAuthConfig({
    ...(config === true ? {} : config),
    ...(apiAddress ? { apiAddress } : {})
  });

  const hasNativeAuth = Boolean(config);

  const client = nativeAuth(configuration);
  const { address } = useGetAccount();
  const dispatch = useDispatch();

  const setLoginToken = (loginToken: string) => {
    tokenRef.current = loginToken;
    dispatch(
      setTokenLogin({
        ...tokenLogin,
        loginToken,
        ...(apiAddress ? { nativeAuthConfig: configuration } : {})
      })
    );
  };

  const getNativeAuthLoginToken = () => {
    try {
      return client.initialize();
    } catch (error) {
      console.error('Unable to get block. Login failed.', error);
      return;
    }
  };

  const setTokenLoginInfo = ({
    address,
    signature
  }: {
    address: string;
    signature: string;
  }) => {
    const loginToken = tokenRef.current;

    if (!loginToken) {
      throw 'Token not found. Call `setLoginToken` first.';
    }

    if (!hasNativeAuth) {
      dispatch(
        setTokenLogin({
          loginToken,
          signature
        })
      );
      return;
    }

    const nativeAuthToken = client.getToken({
      address,
      token: loginToken,
      signature
    });

    dispatch(
      setTokenLogin({
        loginToken,
        signature,
        nativeAuthToken,
        ...(apiAddress ? { nativeAuthConfig: configuration } : {})
      })
    );

    return nativeAuthToken;
  };

  // TODO: @StanislavSava verify and maybe refactor to separate function
  const refreshNativeAuthTokenLogin = async ({
    signMessageCallback,
    nativeAuthClientConfig
  }: {
    signMessageCallback: (
      messageToSign: Message,
      options: Record<any, any>
    ) => Promise<Message>;
    nativeAuthClientConfig?: NativeAuthConfigType;
  }) => {
    const nativeAuthClient = nativeAuth(
      nativeAuthClientConfig || configuration
    );

    const loginToken = await nativeAuthClient.initialize({
      noCache: Boolean(nativeAuthClientConfig)
    });

    tokenRef.current = loginToken;

    if (!loginToken) {
      return;
    }

    const messageToSign = new Message({
      address: Address.newFromBech32(address),
      data: Buffer.from(`${address}${loginToken}`)
    });

    const signedMessage = await signMessageCallback(messageToSign, {});

    if (!signedMessage?.signature) {
      throw 'Message not signed';
    }

    const nativeAuthToken = setTokenLoginInfo({
      address,
      signature: Buffer.from(signedMessage.signature).toString('hex')
    });

    return nativeAuthToken;
  };

  return {
    configuration,
    setLoginToken,
    getNativeAuthLoginToken,
    setTokenLoginInfo,
    refreshNativeAuthTokenLogin
  };
};
