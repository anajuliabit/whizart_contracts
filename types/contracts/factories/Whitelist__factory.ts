/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { Whitelist, WhitelistInterface } from "../Whitelist";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "bool",
        name: "_old",
        type: "bool",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "_new",
        type: "bool",
      },
    ],
    name: "UpdatedWhitelistStatus",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "_address",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "old",
        type: "bool",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "update",
        type: "bool",
      },
    ],
    name: "WhitelistChanged",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "whitelist",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "whitelistActive",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b5060d98061001f6000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c806302ce58131460375780639b19251a146057575b600080fd5b60005460439060ff1681565b604051901515815260200160405180910390f35b604360623660046077565b60016020526000908152604090205460ff1681565b6000602082840312156087578081fd5b81356001600160a01b0381168114609c578182fd5b939250505056fea2646970667358221220511512d20d58ca495cdf7a21c4187275bb3b474fb245c7bb30d95eab87eac78e64736f6c63430008020033";

type WhitelistConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: WhitelistConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class Whitelist__factory extends ContractFactory {
  constructor(...args: WhitelistConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<Whitelist> {
    return super.deploy(overrides || {}) as Promise<Whitelist>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): Whitelist {
    return super.attach(address) as Whitelist;
  }
  connect(signer: Signer): Whitelist__factory {
    return super.connect(signer) as Whitelist__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): WhitelistInterface {
    return new utils.Interface(_abi) as WhitelistInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): Whitelist {
    return new Contract(address, _abi, signerOrProvider) as Whitelist;
  }
}