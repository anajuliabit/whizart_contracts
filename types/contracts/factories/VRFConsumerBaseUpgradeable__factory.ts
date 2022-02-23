/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type {
  VRFConsumerBaseUpgradeable,
  VRFConsumerBaseUpgradeableInterface,
} from "../VRFConsumerBaseUpgradeable";

const _abi = [
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "c__0xc7243301",
        type: "bytes32",
      },
    ],
    name: "c_0xc7243301",
    outputs: [],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "requestId",
        type: "bytes32",
      },
      {
        internalType: "uint256",
        name: "randomness",
        type: "uint256",
      },
    ],
    name: "rawFulfillRandomness",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export class VRFConsumerBaseUpgradeable__factory {
  static readonly abi = _abi;
  static createInterface(): VRFConsumerBaseUpgradeableInterface {
    return new utils.Interface(_abi) as VRFConsumerBaseUpgradeableInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): VRFConsumerBaseUpgradeable {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as VRFConsumerBaseUpgradeable;
  }
}
