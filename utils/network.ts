import { NetworkConfig } from "../types/network-config";

type Networks = { [networkId: string]: NetworkConfig };

export const networkConfig: Networks = {
  default: {
    name: "hardhat",
    keepersUpdateInterval: "30",
  },
  31337: {
    name: "localhost",
    keepersUpdateInterval: "30",
  },
  42: {
    name: "kovan",
    keepersUpdateInterval: "30",
  },
  4: {
    name: "rinkeby",
  },
  137: {
    name: "polygon",
  },
  80001: {
    name: "mumbai",
  },
  97: {
    name: "bsctestnet",
  },
};

export const developmentChains = ["hardhat", "localhost"];

export const getNetworkIdFromName = (networkIdName: string) => {
  for (const id in networkConfig) {
    if (networkConfig[id as keyof Networks].name == networkIdName) {
      return id;
    }
  }
  return null;
};

export function getMnemonic(networkName?: string): string {
  if (networkName) {
    const mnemonic = process.env["MNEMONIC_" + networkName.toUpperCase()];
    if (mnemonic && mnemonic !== "") {
      return mnemonic;
    }
  }

  const mnemonic = process.env.MNEMONIC;
  if (!mnemonic || mnemonic === "") {
    return "test test test test test test test test test test test junk";
  }
  return mnemonic;
}

export function accounts(networkName?: string): { mnemonic: string } {
  return { mnemonic: getMnemonic(networkName) };
}
