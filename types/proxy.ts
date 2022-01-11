export type Proxy = {
  manifestVersion: string;
  proxies: {
    address: string;
    txHash: string;
    kind: string;
  }[];
  impls: {
    [key: string]: {
      address: string;
    };
  };
};
