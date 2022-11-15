import React, { useEffect, useMemo, ReactNode } from 'react';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';

import wrapperStyles from 'UI/TransactionsToastList/transactionsToastList.styles.scss';
import { WithClassnameType } from '../../../types';
import { ComponentTypeWithChildren } from '../types';

import styles from './customToast.styles.scss';

export interface CustomToastPropsType extends WithClassnameType {
  onDelete: () => void;
  message?: string;
  messageComponent?: ReactNode;
  duration?: number;
  CustomCloseButton?: ComponentTypeWithChildren<{
    onClick?: () => void;
  }>;
}

export const CustomToast = ({
  onDelete,
  message,
  messageComponent,
  duration,
  CustomCloseButton,
  className = 'dapp-custom-toast'
}: CustomToastPropsType) => {
  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;
    if (duration) {
      timeout = setTimeout(onDelete, duration);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [duration]);

  const closeButton = useMemo(() => {
    return CustomCloseButton ? (
      <CustomCloseButton onClick={onDelete} />
    ) : (
      <button type='button' className={styles.close} onClick={onDelete}>
        <FontAwesomeIcon icon={faTimes} size='xs' />
      </button>
    );
  }, [CustomCloseButton, onDelete]);

  return (
    <div
      className={classNames(
        wrapperStyles.toasts,
        wrapperStyles.toastWrapper,
        className
      )}
    >
      {closeButton}
      {messageComponent ? messageComponent : message}
    </div>
  );
};
