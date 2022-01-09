/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type {
  ERC721Upgradeable,
  ERC721UpgradeableInterface,
} from "../ERC721Upgradeable";

const _abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "approved",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "ApprovalForAll",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "getApproved",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
    ],
    name: "isApprovedForAll",
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
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "ownerOf",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "_data",
        type: "bytes",
      },
    ],
    name: "safeTransferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "operator",
        type: "address",
      },
      {
        internalType: "bool",
        name: "approved",
        type: "bool",
      },
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes4",
        name: "interfaceId",
        type: "bytes4",
      },
    ],
    name: "supportsInterface",
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
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "tokenURI",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b50611253806100206000396000f3fe608060405234801561001057600080fd5b50600436106100cf5760003560e01c80636352211e1161008c578063a22cb46511610066578063a22cb465146101b3578063b88d4fde146101c6578063c87b56dd146101d9578063e985e9c5146101ec576100cf565b80636352211e1461017757806370a082311461018a57806395d89b41146101ab576100cf565b806301ffc9a7146100d457806306fdde03146100fc578063081812fc14610111578063095ea7b31461013c57806323b872dd1461015157806342842e0e14610164575b600080fd5b6100e76100e2366004610f4b565b610228565b60405190151581526020015b60405180910390f35b61010461027c565b6040516100f39190611033565b61012461011f366004610f83565b61030e565b6040516001600160a01b0390911681526020016100f3565b61014f61014a366004610f22565b6103a8565b005b61014f61015f366004610dd8565b6104be565b61014f610172366004610dd8565b6104ef565b610124610185366004610f83565b61050a565b61019d610198366004610d8c565b610581565b6040519081526020016100f3565b610104610608565b61014f6101c1366004610ee8565b610617565b61014f6101d4366004610e13565b610626565b6101046101e7366004610f83565b61065e565b6100e76101fa366004610da6565b6001600160a01b039182166000908152606a6020908152604080832093909416825291909152205460ff1690565b60006001600160e01b031982166380ac58cd60e01b148061025957506001600160e01b03198216635b5e139f60e01b145b8061027457506301ffc9a760e01b6001600160e01b03198316145b90505b919050565b60606065805461028b90611158565b80601f01602080910402602001604051908101604052809291908181526020018280546102b790611158565b80156103045780601f106102d957610100808354040283529160200191610304565b820191906000526020600020905b8154815290600101906020018083116102e757829003601f168201915b5050505050905090565b6000818152606760205260408120546001600160a01b031661038c5760405162461bcd60e51b815260206004820152602c60248201527f4552433732313a20617070726f76656420717565727920666f72206e6f6e657860448201526b34b9ba32b73a103a37b5b2b760a11b60648201526084015b60405180910390fd5b506000908152606960205260409020546001600160a01b031690565b60006103b38261050a565b9050806001600160a01b0316836001600160a01b031614156104215760405162461bcd60e51b815260206004820152602160248201527f4552433732313a20617070726f76616c20746f2063757272656e74206f776e656044820152603960f91b6064820152608401610383565b336001600160a01b038216148061043d575061043d81336101fa565b6104af5760405162461bcd60e51b815260206004820152603860248201527f4552433732313a20617070726f76652063616c6c6572206973206e6f74206f7760448201527f6e6572206e6f7220617070726f76656420666f7220616c6c00000000000000006064820152608401610383565b6104b98383610746565b505050565b6104c833826107b4565b6104e45760405162461bcd60e51b815260040161038390611098565b6104b98383836108ab565b6104b983838360405180602001604052806000815250610626565b6000818152606760205260408120546001600160a01b0316806102745760405162461bcd60e51b815260206004820152602960248201527f4552433732313a206f776e657220717565727920666f72206e6f6e657869737460448201526832b73a103a37b5b2b760b91b6064820152608401610383565b60006001600160a01b0382166105ec5760405162461bcd60e51b815260206004820152602a60248201527f4552433732313a2062616c616e636520717565727920666f7220746865207a65604482015269726f206164647265737360b01b6064820152608401610383565b506001600160a01b031660009081526068602052604090205490565b60606066805461028b90611158565b610622338383610a4b565b5050565b61063033836107b4565b61064c5760405162461bcd60e51b815260040161038390611098565b61065884848484610b1a565b50505050565b6000818152606760205260409020546060906001600160a01b03166106dd5760405162461bcd60e51b815260206004820152602f60248201527f4552433732314d657461646174613a2055524920717565727920666f72206e6f60448201526e3732bc34b9ba32b73a103a37b5b2b760891b6064820152608401610383565b60006106f460408051602081019091526000815290565b90506000815111610714576040518060200160405280600081525061073f565b8061071e84610b4d565b60405160200161072f929190610fc7565b6040516020818303038152906040525b9392505050565b600081815260696020526040902080546001600160a01b0319166001600160a01b038416908117909155819061077b8261050a565b6001600160a01b03167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92560405160405180910390a45050565b6000818152606760205260408120546001600160a01b031661082d5760405162461bcd60e51b815260206004820152602c60248201527f4552433732313a206f70657261746f7220717565727920666f72206e6f6e657860448201526b34b9ba32b73a103a37b5b2b760a11b6064820152608401610383565b60006108388361050a565b9050806001600160a01b0316846001600160a01b031614806108735750836001600160a01b03166108688461030e565b6001600160a01b0316145b806108a357506001600160a01b038082166000908152606a602090815260408083209388168352929052205460ff165b949350505050565b826001600160a01b03166108be8261050a565b6001600160a01b0316146109265760405162461bcd60e51b815260206004820152602960248201527f4552433732313a207472616e73666572206f6620746f6b656e2074686174206960448201526839903737ba1037bbb760b91b6064820152608401610383565b6001600160a01b0382166109885760405162461bcd60e51b8152602060048201526024808201527f4552433732313a207472616e7366657220746f20746865207a65726f206164646044820152637265737360e01b6064820152608401610383565b610993600082610746565b6001600160a01b03831660009081526068602052604081208054600192906109bc908490611115565b90915550506001600160a01b03821660009081526068602052604081208054600192906109ea9084906110e9565b909155505060008181526067602052604080822080546001600160a01b0319166001600160a01b0386811691821790925591518493918716917fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef91a4505050565b816001600160a01b0316836001600160a01b03161415610aad5760405162461bcd60e51b815260206004820152601960248201527f4552433732313a20617070726f766520746f2063616c6c6572000000000000006044820152606401610383565b6001600160a01b038381166000818152606a6020908152604080832094871680845294825291829020805460ff191686151590811790915591519182527f17307eab39ab6107e8899845ad3d59bd9653f200f220920489ca2b5937696c31910160405180910390a3505050565b610b258484846108ab565b610b3184848484610c68565b6106585760405162461bcd60e51b815260040161038390611046565b606081610b7257506040805180820190915260018152600360fc1b6020820152610277565b8160005b8115610b9c5780610b8681611193565b9150610b959050600a83611101565b9150610b76565b60008167ffffffffffffffff811115610bc557634e487b7160e01b600052604160045260246000fd5b6040519080825280601f01601f191660200182016040528015610bef576020820181803683370190505b5090505b84156108a357610c04600183611115565b9150610c11600a866111ae565b610c1c9060306110e9565b60f81b818381518110610c3f57634e487b7160e01b600052603260045260246000fd5b60200101906001600160f81b031916908160001a905350610c61600a86611101565b9450610bf3565b60006001600160a01b0384163b15610d6a57604051630a85bd0160e11b81526001600160a01b0385169063150b7a0290610cac903390899088908890600401610ff6565b602060405180830381600087803b158015610cc657600080fd5b505af1925050508015610cf6575060408051601f3d908101601f19168201909252610cf391810190610f67565b60015b610d50573d808015610d24576040519150601f19603f3d011682016040523d82523d6000602084013e610d29565b606091505b508051610d485760405162461bcd60e51b815260040161038390611046565b805181602001fd5b6001600160e01b031916630a85bd0160e11b1490506108a3565b506001949350505050565b80356001600160a01b038116811461027757600080fd5b600060208284031215610d9d578081fd5b61073f82610d75565b60008060408385031215610db8578081fd5b610dc183610d75565b9150610dcf60208401610d75565b90509250929050565b600080600060608486031215610dec578081fd5b610df584610d75565b9250610e0360208501610d75565b9150604084013590509250925092565b60008060008060808587031215610e28578081fd5b610e3185610d75565b9350610e3f60208601610d75565b925060408501359150606085013567ffffffffffffffff80821115610e62578283fd5b818701915087601f830112610e75578283fd5b813581811115610e8757610e876111ee565b604051601f8201601f19908116603f01168101908382118183101715610eaf57610eaf6111ee565b816040528281528a6020848701011115610ec7578586fd5b82602086016020830137918201602001949094529598949750929550505050565b60008060408385031215610efa578182fd5b610f0383610d75565b915060208301358015158114610f17578182fd5b809150509250929050565b60008060408385031215610f34578182fd5b610f3d83610d75565b946020939093013593505050565b600060208284031215610f5c578081fd5b813561073f81611204565b600060208284031215610f78578081fd5b815161073f81611204565b600060208284031215610f94578081fd5b5035919050565b60008151808452610fb381602086016020860161112c565b601f01601f19169290920160200192915050565b60008351610fd981846020880161112c565b835190830190610fed81836020880161112c565b01949350505050565b6001600160a01b038581168252841660208201526040810183905260806060820181905260009061102990830184610f9b565b9695505050505050565b60006020825261073f6020830184610f9b565b60208082526032908201527f4552433732313a207472616e7366657220746f206e6f6e20455243373231526560408201527131b2b4bb32b91034b6b83632b6b2b73a32b960711b606082015260800190565b60208082526031908201527f4552433732313a207472616e736665722063616c6c6572206973206e6f74206f6040820152701ddb995c881b9bdc88185c1c1c9bdd9959607a1b606082015260800190565b600082198211156110fc576110fc6111c2565b500190565b600082611110576111106111d8565b500490565b600082821015611127576111276111c2565b500390565b60005b8381101561114757818101518382015260200161112f565b838111156106585750506000910152565b60028104600182168061116c57607f821691505b6020821081141561118d57634e487b7160e01b600052602260045260246000fd5b50919050565b60006000198214156111a7576111a76111c2565b5060010190565b6000826111bd576111bd6111d8565b500690565b634e487b7160e01b600052601160045260246000fd5b634e487b7160e01b600052601260045260246000fd5b634e487b7160e01b600052604160045260246000fd5b6001600160e01b03198116811461121a57600080fd5b5056fea2646970667358221220d214570a567274c545550d39099f98d01e11173c4d978a1ebb03707c8650049a64736f6c63430008020033";

type ERC721UpgradeableConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: ERC721UpgradeableConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class ERC721Upgradeable__factory extends ContractFactory {
  constructor(...args: ERC721UpgradeableConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ERC721Upgradeable> {
    return super.deploy(overrides || {}) as Promise<ERC721Upgradeable>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): ERC721Upgradeable {
    return super.attach(address) as ERC721Upgradeable;
  }
  connect(signer: Signer): ERC721Upgradeable__factory {
    return super.connect(signer) as ERC721Upgradeable__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ERC721UpgradeableInterface {
    return new utils.Interface(_abi) as ERC721UpgradeableInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ERC721Upgradeable {
    return new Contract(address, _abi, signerOrProvider) as ERC721Upgradeable;
  }
}
