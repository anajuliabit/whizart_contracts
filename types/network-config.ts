export type NetworkConfig = {
  name: string;
  keyHash: string;
  keepersUpdateInterval?: string;
  linkToken?: string;
  ethUsdPriceFeed?: string;
  vrfCoordinator?: string;
};
