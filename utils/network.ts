import { NetworkConfig } from "../types/network-config";

type Networks = { [networkId: string]: NetworkConfig };

export const networkConfig: Networks = {
  default: {
    name: "hardhat",
    keyHash:
      "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4",
    keepersUpdateInterval: "30",
  },
  31337: {
    name: "localhost",
    keyHash:
      "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4",
    keepersUpdateInterval: "30",
    vrfCoordinator: "0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B",
    linkToken: "0x01be23585060835e02b77ef475b0cc51aa1e0709",
  },
  42: {
    name: "kovan",
    linkToken: "0xa36085F69e2889c224210F603D836748e7dC0088",
    ethUsdPriceFeed: "0x9326BFA02ADD2366b30bacB125260Af641031331",
    keyHash:
      "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4",
    vrfCoordinator: "0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9",
    keepersUpdateInterval: "30",
  },
  4: {
    name: "rinkeby",
    linkToken: "0x01be23585060835e02b77ef475b0cc51aa1e0709",
    ethUsdPriceFeed: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
    keyHash:
      "0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311",
    vrfCoordinator: "0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B",
  },
  137: {
    name: "polygon",
    linkToken: "0xb0897686c545045afc77cf20ec7a532e3120e0f1",
    ethUsdPriceFeed: "0xF9680D99D6C9589e2a93a78A04A279e509205945",
    keyHash:
      "0xf86195cf7690c55907b2b611ebb7343a6f649bff128701cc542f0569e2c549da",
    vrfCoordinator: "0x3d2341ADb2D31f1c5530cDC622016af293177AE0",
  },
  80001: {
    name: "mumbai",
    linkToken: "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
    vrfCoordinator: "0x8C7382F9D8f56b33781fE506E897a4F1e2d17255",
    keyHash:
      "0x6e75b569a01ef56d18cab6a8e71e6600d6ce853834d4a5748b720d06f878b3a4",
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
