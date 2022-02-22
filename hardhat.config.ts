// eslint-disable-next-line @typescript-eslint/no-unsafe-call
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";
import "@tenderly/hardhat-tenderly";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import { HardhatUserConfig, task } from "hardhat/config";
import "solidity-coverage";
import "tsconfig-paths/register";
import { TEthers, TUpgrades } from "types/hardhat-type-extensions";
import { accounts } from "utils/network";

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
    deployer: 0,
    treasury: 0,
    beneficiary: 1,
  },
  networks: {
    hardhat: {
      gasPrice: 8000000000,
      gas: 2100000,
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${
        process.env.RINKEBY_INFURA_KEY ?? ""
      }`,
      accounts: accounts("rinkeby"),
      gasPrice: 8000000000,
      gas: 2100000,
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${
        process.env.ROPSTEN_INFURA_KEY ?? ""
      }`,
      accounts: accounts("ropsten"),
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${process.env.KOVAN_INFURA_KEY ?? ""}`,
      accounts: accounts("kovan"),
    },
    mumbai: {
      url: `${process.env.MUMBAI_RPC_URL} ?? ""`,
      accounts: accounts("mumbai"),
      gasPrice: 8000000000,
      gas: 2100000,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.2",
        settings: {
          optimizer: {
            enabled: true,
            runs: 100,
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
    apiKey: process.env.POLYGON_API_KEY,
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

// task("add-uri", "Add availables URI to mint")
//   .addPositionalParam("rarity", "The rarity")
//   .setAction(
//     async (
//       taskArgs: {
//         rarity: string;
//       },
//       { ethers, getNamedAccounts }
//     ) => {
//       const proxy = (await import(
//         `./.openzeppelin/unknown-80001.json`
//       )) as Proxy;

//       const implKeys = Object.keys(proxy.impls);
//       const WArtistContract: WhizartArtist = await ethers.getContractAt(
//         "WArtist",
//         proxy.impls[implKeys[implKeys.length - 1]].address
//       );

//       const uris = [
//         "bafkreide3yekzsbxgakge5j7qkgwvddhigjjoxao2so64neh7v624zp4jm",
//         "bafkreie3aq3kllp347gb53izfl3nubs2rgw6qbtkqh3lsbpm7jc7f27uqq",
//       ];
//       // delegates call to proxy contract
//       const contract = WArtistContract.attach(
//         proxy.proxies[proxy.proxies.length - 1].address
//       );
//       const { deployer } = await getNamedAccounts();
//       const owner = await ethers.getSigner(deployer);

//       const transaction = await contract
//         .connect(owner)
//         .addAvailableURIs(Number(taskArgs.rarity), uris);
//       await transaction.wait();
//     }
//   );
