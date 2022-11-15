import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TRANSACTION_STATUS_TOAST_ID } from 'constants/transactionStatus';
import { ToastsEnum } from 'types';
import {
  CustomToastType,
  FailTransactionToastType,
  IconToastType,
  TransactionToastType
} from 'types/toasts.types';
import { getUnixTimestamp } from 'utils/dateTime/getUnixTimestamp';
import { logoutAction } from '../commonActions';

export interface ToastsSliceState {
  customToasts: CustomToastType[];
  iconToasts: IconToastType[];
  transactionToasts: TransactionToastType[];
  failTransactionToast: FailTransactionToastType | null;
}

const initialState: ToastsSliceState = {
  customToasts: [],
  iconToasts: [],
  transactionToasts: [],
  failTransactionToast: null
};

export const toastsSlice = createSlice({
  name: 'toastsSlice',
  initialState,
  reducers: {
    addCustomToast: (
      state: ToastsSliceState,
      action: PayloadAction<CustomToastType>
    ) => {
      state.customToasts.push({
        ...action.payload,
        type: ToastsEnum.custom,
        toastId:
          action.payload.toastId ||
          `custom-toast-${state.customToasts.length + 1}`
      });
    },
    addIconToast: (
      state: ToastsSliceState,
      action: PayloadAction<IconToastType>
    ) => {
      state.iconToasts.push({
        ...action.payload,
        type: ToastsEnum.icon,
        toastId:
          action.payload.toastId || `icon-toast-${state.iconToasts.length + 1}`
      });
    },
    removeCustomToast: (
      state: ToastsSliceState,
      action: PayloadAction<string>
    ) => {
      state.customToasts = state.customToasts.filter(
        (toast) => toast.toastId !== action.payload
      );
    },
    removeIconToast: (
      state: ToastsSliceState,
      action: PayloadAction<string>
    ) => {
      state.iconToasts = state.iconToasts.filter(
        (toast) => toast.toastId !== action.payload
      );
    },
    addTransactionToast: (
      state: ToastsSliceState,
      action: PayloadAction<string>
    ) => {
      state.transactionToasts.push({
        type: ToastsEnum.transaction,
        startTimestamp: getUnixTimestamp(),
        toastId:
          action.payload || `custom-toast-${state.transactionToasts.length + 1}`
      });
    },
    removeTransactionToast: (
      state: ToastsSliceState,
      action: PayloadAction<string>
    ) => {
      state.transactionToasts = state.transactionToasts.filter((toast) => {
        return toast.toastId !== action.payload;
      });
    },
    addFailTransactionToast: (
      state: ToastsSliceState,
      action: PayloadAction<FailTransactionToastType>
    ) => {
      state.failTransactionToast = {
        ...action.payload,
        toastId: TRANSACTION_STATUS_TOAST_ID
      };
    },
    removeFailTransactionToast: (state: ToastsSliceState) => {
      state.failTransactionToast = null;
    }
  },

  extraReducers: (builder) => {
    builder.addCase(logoutAction, () => {
      return initialState;
    });
  }
});

export const {
  addCustomToast,
  removeCustomToast,
  addIconToast,
  removeIconToast,
  addTransactionToast,
  removeTransactionToast,
  addFailTransactionToast,
  removeFailTransactionToast
} = toastsSlice.actions;

export default toastsSlice.reducer;
