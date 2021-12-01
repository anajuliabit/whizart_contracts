// eslint-disable-next-line
import { ExternalProvider } from '@ethersproject/providers/src.ts/web3-provider';
import '@nomiclabs/hardhat-ethers';

export { };
export { };

declare global {
  interface hre {
    ethers: ExternalProvider;
  }
  interface Window {
    ethereum: ExternalProvider;
  }
}


