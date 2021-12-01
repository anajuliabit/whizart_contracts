require("dotenv").config();
import '@nomiclabs/hardhat-ethers';
import "@nomiclabs/hardhat-etherscan";
import '@nomiclabs/hardhat-waffle';
import '@tenderly/hardhat-tenderly';
import '@typechain/hardhat';
import { utils } from 'ethers';
import 'hardhat-deploy';
import { HardhatUserConfig, task } from 'hardhat/config';
import { TEthers } from 'helpers/types/hardhat-type-extensions';
import "solidity-coverage";
import 'tsconfig-paths/register';


declare module 'hardhat/types/runtime' {
  export interface HardhatRuntimeEnvironment {
    ethers: TEthers;
  }
}

const { isAddress, getAddress, formatUnits } = utils;
const defaultNetwork = 'rinkeby';

const config: HardhatUserConfig = {
  defaultNetwork,
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
    },
  },
  networks: {
    localhost: {
      url: 'http://localhost:8545',
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.RINKEBY_INFURA_KEY}`,
      accounts: [`${process.env.RINKEBY_DEPLOYER_PRIV_KEY}`],
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.ROPSTEN_INFURA_KEY}`,
      accounts: [`${process.env.ROPSTEN_DEPLOYER_PRIV_KEY}`],
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
        version: '0.8.9',
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
    cache: './generated/cache',
    artifacts: './generated/artifacts',
    deployments: './generated/deployments',
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  }
};
export default config;

const findFirstAddr = async (ethers: TEthers, addr: string) => {
  if (isAddress(addr)) {
    return getAddress(addr);
  }
  const accounts = await ethers.provider.listAccounts();
  if (accounts !== undefined) {
    const temp = accounts.find((f: string) => f === addr);
    if (temp?.length) return temp[0];
  }
  throw `Could not normalize address: ${addr}`;
};

task('accounts', 'Prints the list of accounts', async (_, { ethers }) => {
  const accounts = await ethers.provider.listAccounts();
  accounts.forEach((account: any) => console.log(account));
});

task('blockNumber', 'Prints the block number', async (_, { ethers }) => {
  const blockNumber = await ethers.provider.getBlockNumber();
  console.log(blockNumber);
});

task('balance', "Prints an account's balance")
  .addPositionalParam('account', "The account's address")
  .setAction(async (taskArgs, { ethers }) => {
    const balance = await ethers.provider.getBalance(await findFirstAddr(ethers, taskArgs.account));
    console.log(formatUnits(balance, 'ether'), 'ETH');
  });




