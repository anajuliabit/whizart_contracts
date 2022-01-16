export type NetworkConfig = {
  name: string;
  fee: string;
  keyHash: string;
  jobId: string;
  fundAmount: string;
  keepersUpdateInterval?: string;
  linkToken?: string;
  ethUsdPriceFeed?: string;
  vrfCoordinator?: string;
  oracle?: string;
  stableCoinAddress?: string;
  whaleStableCoinAddress?: string;
};
