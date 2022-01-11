import { utils } from "ethers";
import { task } from "hardhat/config";

import { TEthers } from "hardhat-type-extensions";

const { isAddress, getAddress, formatUnits } = utils;

const findFirstAddr = async (ethers: TEthers, addr: string) => {
  if (isAddress(addr)) {
    return getAddress(addr);
  }
  const accounts = await ethers.provider.listAccounts();
  if (accounts !== undefined) {
    const temp = accounts.find((f: string) => f === addr);
    if (temp?.length) return temp[0];
  }
  throw new Error(`Could not normalize address: ${addr}`);
};

task("balance", "Prints an account's balance")
  .addPositionalParam("account", "The account's address")
  .setAction(async (taskArgs: { account: string }, { ethers }) => {
    const balance = await ethers.provider.getBalance(
      await findFirstAddr(ethers, taskArgs.account)
    );
    console.log(formatUnits(balance, "ether"), "ETH");
  });
