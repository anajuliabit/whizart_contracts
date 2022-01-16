// eslint-disable-next-line
import { ExternalProvider } from "@ethersproject/providers/src.ts/web3-provider";
import "@nomiclabs/hardhat-ethers";

export {};

declare global {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface hre {
    ethers: ExternalProvider;
  }

  interface Window {
    ethereum: ExternalProvider;
  }
}
