import React, { useEffect, useState } from 'react';

import platform from 'optionalPackages/platform';
import QRCode from 'optionalPackages/qrcode';
import { useWalletConnectLogin } from 'services';
import { getGeneratedClasses } from 'utils';
import DappModal from '../../DappModal/components/DappModal';
import useDappModal from '../../DappModal/hooks/useDappModal';
import { ReactComponent as Lighting } from '../WalletConnectLoginButton/lightning.svg';
import { LoginModalPropsType } from './types';

function WalletConnectLoginContainer({
  callbackRoute,
  loginButtonText,
  title = 'Maiar Login',
  logoutRoute = '/unlock',
  className = 'wallect-connect-login-modal',
  lead = 'Scan the QR code using Maiar',
  shouldRenderDefaultCss = true,
  wrapContentInsideModal = true,
  redirectAfterLogin,
  token,
  onClose
}: LoginModalPropsType) {
  const [
    initLoginWithWalletConnect,
    { error },
    { uriDeepLink, walletConnectUri }
  ] = useWalletConnectLogin({
    logoutRoute,
    callbackRoute,
    token,
    redirectAfterLogin,
    shouldLoginUser: true
  });
  const [qrCodeSvg, setQrCodeSvg] = useState<string>('');
  const isMobileDevice =
    platform?.os?.family === 'iOS' || platform?.os?.family === 'Android';
  const generatedClasses = getGeneratedClasses(
    className,
    shouldRenderDefaultCss,
    {
      wrapper: 'btn btn-primary px-sm-4 m-1 mx-sm-3',
      loginText: 'text-left',
      container: 'm-auto login-container',
      card: 'card my-3 text-center',
      cardBody: 'card-body p-4 mx-lg-4',
      qrCodeSvgContainer: 'mx-auto mb-3',
      title: 'mb-3',
      leadText: 'lead mb-0',
      mobileLoginButton:
        'btn btn-primary d-inline-flex align-items-center px-4 mt-4',
      mobileLoginButtonIcon: 'mr-2',
      errorMessage:
        'text-danger d-flex justify-content-center align-items-center'
    }
  );
  const { hide: onHide, visible } = useDappModal();

  const generateQRCode = async () => {
    if (!walletConnectUri) {
      return;
    }

    const svg = await QRCode.toString(walletConnectUri, {
      type: 'svg'
    });

    setQrCodeSvg(svg);
  };

  useEffect(() => {
    generateQRCode();
  }, [walletConnectUri]);

  useEffect(() => {
    initLoginWithWalletConnect();
  }, []);

  const content = (
    <div className={generatedClasses.container}>
      <div className={generatedClasses.root}>
        <div className={generatedClasses.card}>
          <div className={generatedClasses.cardBody}>
            <div
              className={generatedClasses.qrCodeSvgContainer}
              dangerouslySetInnerHTML={{
                __html: qrCodeSvg
              }}
              style={{
                width: '15rem',
                height: '15rem'
              }}
            />
            <h4 className={generatedClasses.title}>{title}</h4>
            {isMobileDevice ? (
              <React.Fragment>
                <p className={generatedClasses.leadText}>{loginButtonText}</p>
                <a
                  id='accessWalletBtn'
                  data-testid='accessWalletBtn'
                  className={generatedClasses.mobileLoginButton}
                  href={uriDeepLink || undefined}
                  rel='noopener noreferrer nofollow'
                  target='_blank'
                >
                  <Lighting
                    className={generatedClasses.mobileLoginButtonIcon}
                    style={{
                      width: '0.9rem',
                      height: '0.9rem'
                    }}
                  />
                  {title}
                </a>
              </React.Fragment>
            ) : (
              <p className={generatedClasses.leadText}>{lead}</p>
            )}
            <div>
              {error && (
                <p className={generatedClasses.errorMessage}>{error}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return wrapContentInsideModal ? (
    <DappModal
      onHide={() => {
        onHide();
        onClose?.();
      }}
      visible={visible}
      headerText={'Login with Maiar'}
      showHeader={true}
      className={className}
    >
      {content}
    </DappModal>
  ) : (
    content
  );
}

export default WalletConnectLoginContainer;
