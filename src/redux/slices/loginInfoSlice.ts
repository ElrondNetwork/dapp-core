import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LoginMethodsEnum } from '../../types';
import {
  loginAction,
  logoutAction,
  LoginActionPayloadType
} from '../commonActions';

export interface WalletConnectLoginType {
  loginType: string;
  callbackRoute: string;
  logoutRoute: string;
}

export interface LedgerLoginType {
  index: number;
  loginType: string;
}

export interface LoginInfoType {
  data: any;
  expires: number;
}

export interface TokenLoginType {
  loginToken: string;
  signature?: string;
}

export interface LoginInfoStateType {
  loginMethod: LoginMethodsEnum;
  walletConnectLogin: WalletConnectLoginType | null;
  ledgerLogin: LedgerLoginType | null;
  tokenLogin: TokenLoginType | null;
  loginExpiresAt: number | null;
  walletLogin: LoginInfoType | null;
  extensionLogin: LoginInfoType | null;
}

const initialState: LoginInfoStateType = {
  loginMethod: LoginMethodsEnum.none,
  walletConnectLogin: null,
  ledgerLogin: null,
  tokenLogin: null,
  loginExpiresAt: null,
  walletLogin: null,
  extensionLogin: null
};

export const loginInfoSlice = createSlice({
  name: 'loginInfoSlice',
  initialState: initialState,
  reducers: {
    setLoginMethod: (
      state: LoginInfoStateType,
      action: PayloadAction<LoginMethodsEnum>
    ) => {
      state.loginMethod = action.payload;
    },
    setTokenLogin: (
      state: LoginInfoStateType,
      action: PayloadAction<TokenLoginType>
    ) => {
      state.tokenLogin = action.payload;
    },
    setWalletLogin: (
      state: LoginInfoStateType,
      action: PayloadAction<LoginInfoType | null>
    ) => {
      state.walletLogin = action.payload;
    },
    setExtensionLogin: (
      state: LoginInfoStateType,
      action: PayloadAction<LoginInfoType | null>
    ) => {
      state.extensionLogin = action.payload;
    },
    setWalletConnectLogin: (
      state: LoginInfoStateType,
      action: PayloadAction<WalletConnectLoginType | null>
    ) => {
      state.walletConnectLogin = action.payload;
    },
    setLedgerLogin: (
      state: LoginInfoStateType,
      action: PayloadAction<LedgerLoginType | null>
    ) => {
      state.ledgerLogin = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(logoutAction, () => {
      return initialState;
    });
    builder.addCase(
      loginAction,
      (
        state: LoginInfoStateType,
        action: PayloadAction<LoginActionPayloadType>
      ) => {
        state.loginMethod = action.payload.loginMethod;
      }
    );
  }
});

export const {
  setLoginMethod,
  setWalletConnectLogin,
  setLedgerLogin,
  setTokenLogin,
  setWalletLogin,
  setExtensionLogin
} = loginInfoSlice.actions;

export default loginInfoSlice.reducer;
