// eslint-disable-next-line @typescript-eslint/no-unsafe-call
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
import "hardhat-deploy";
import { HardhatUserConfig, task } from "hardhat/config";
import "solidity-coverage";
import "tsconfig-paths/register";
import { TEthers, TUpgrades } from "types/hardhat-type-extensions";

declare module "hardhat/types/runtime" {
  export interface HardhatRuntimeEnvironmentExtended {
    ethers: TEthers;
    upgrades: TUpgrades;
  }
}

const defaultNetwork = "hardhat";

const config: HardhatUserConfig = {
  defaultNetwork,
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
    },
  },
  networks: {
    localhost: {
      url: "http://localhost:8545",
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${
        process.env.RINKEBY_INFURA_KEY ?? ""
      }`,
      accounts: [
        `${process.env.RINKEBY_DEPLOYER_PRIV_KEY ?? ""}`,
        `${process.env.RINKEBY_TEST_ACCOUNT_PRIV_KEY ?? ""}`,
      ],
      // gasPrice: 8000000000,
      // gas: 2100000
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${
        process.env.ROPSTEN_INFURA_KEY ?? ""
      }`,
      accounts: [`${process.env.ROPSTEN_DEPLOYER_PRIV_KEY ?? ""}`],
    },
    // matic: {
    //   url: 'https://rpc-mainnet.maticvigil.com/',
    //   gasPrice: 1000000000,
    //   accounts: {
    //     mnemonic: getMnemonic(),
    //   },
    // },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.2",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  paths: {
    cache: "./generated/cache",
    artifacts: "./generated/artifacts",
    deployments: "./generated/deployments",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  typechain: {
    outDir: "types/contracts",
    target: "ethers-v5",
  },
};
export default config;

task("accounts", "Prints the list of accounts", async (_, { ethers }) => {
  const accounts = await ethers.getSigners();
  accounts.forEach((account: any) => console.log(account));
});

task("blockNumber", "Prints the block number", async (_, { ethers }) => {
  const blockNumber = await ethers.provider.getBlockNumber();
  console.log(blockNumber);
});
