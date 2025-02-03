import { CrossWindowProvider } from 'lib/sdkWebWalletCrossWindowProvider';
import { IframeProvider } from 'lib/sdkWebWalletIframeProvider';
import { LoginMethodsEnum } from 'types';

export const clearInitiatedLogins = (props?: {
  skipLoginMethod: LoginMethodsEnum;
}) => {
  Object.values(LoginMethodsEnum).forEach((method) => {
    if (method === props?.skipLoginMethod) {
      return;
    }

    switch (method) {
      case LoginMethodsEnum.crossWindow: {
        const crossWindowProvider = CrossWindowProvider.getInstance();
        if (crossWindowProvider.isInitialized()) {
          crossWindowProvider.dispose();
        }
        break;
      }

      case LoginMethodsEnum.iframe: {
        const iframeProvider = IframeProvider.getInstance();
        if (iframeProvider.isInitialized()) {
          iframeProvider.dispose();
        }
        break;
      }
      default:
        break;
    }
  });

  return null;
};
