import '@nomiclabs/hardhat-ethers';
import { HardhatEthersHelpers } from '@nomiclabs/hardhat-ethers/dist/src/types';
import '@nomiclabs/hardhat-waffle';
import '@tenderly/hardhat-tenderly';
import '@typechain/hardhat';
import { ethers } from 'ethers';
import 'hardhat-deploy';
import 'hardhat-deploy/src/type-extensions';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

export type ContractJson = {
  _format: string;
  contractName: string;
  abi: Record<string, object>[];
  bytecode: string;
  deployedBytecode: string;
  linkReferences: Record<string, object>;
  deployedLinkReferences: Record<string, object>;
  address: string;
};

export type { HardhatRuntimeEnvironment as HardhatRuntimeEnvironmentExtended };

export type TEthers = typeof ethers & HardhatEthersHelpers;
