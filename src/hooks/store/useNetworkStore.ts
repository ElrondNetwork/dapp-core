import { useNetworkStore } from 'lib/sdkDappCore';

export const useNetwork = () => {
  const data = useNetworkStore().network;
  return data;
};
