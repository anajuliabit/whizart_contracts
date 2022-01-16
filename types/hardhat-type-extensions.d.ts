import "@nomiclabs/hardhat-ethers";
import { HardhatEthersHelpers } from "@nomiclabs/hardhat-ethers/dist/src/types";
import "@nomiclabs/hardhat-waffle";
import { HardhatUpgrades } from "@openzeppelin/hardhat-upgrades";
import { ValidationOptions } from "@openzeppelin/upgrades-core";
import "@tenderly/hardhat-tenderly";
import "@typechain/hardhat";
import type { Contract, ContractFactory } from "ethers";
import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";

export interface Options extends ValidationOptions {
  constructorArgs?: unknown[];
}
interface DeployOptions extends Options {
  initializer?: string | false;
  kind: "uups" | "transparent";
}
interface DeployFunction {
  (
    ImplFactory: ContractFactory,
    args?: unknown[],
    opts?: DeployOptions
  ): Promise<Contract>;
  (ImplFactory: ContractFactory, opts?: DeployOptions): Promise<Contract>;
}

export type TUpgrades = Omit<HardhatUpgrades, "deployProxy"> & {
  deployProxy: DeployFunction;
};
export type TEthers = typeof ethers & HardhatEthersHelpers;

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
