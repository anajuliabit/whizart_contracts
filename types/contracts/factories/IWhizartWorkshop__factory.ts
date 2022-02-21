/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type {
  IWhizartWorkshop,
  IWhizartWorkshopInterface,
} from "../IWhizartWorkshop";

const _abi = [
  {
    inputs: [],
    name: "mint",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint8",
        name: "rarity",
        type: "uint8",
      },
    ],
    name: "mintBox",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
];

export class IWhizartWorkshop__factory {
  static readonly abi = _abi;
  static createInterface(): IWhizartWorkshopInterface {
    return new utils.Interface(_abi) as IWhizartWorkshopInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IWhizartWorkshop {
    return new Contract(address, _abi, signerOrProvider) as IWhizartWorkshop;
  }
}