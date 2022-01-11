import { BigNumber } from "ethers";
import { task } from "hardhat/config";

import { ERC20 } from "types/contracts";

task("approve", "Approve an ERC20")
  .addPositionalParam("account", "The account address")
  .addPositionalParam("contract", "The contract address")
  .addPositionalParam("name", "The contract name")
  .addPositionalParam("token", "The token address")
  .addPositionalParam("amount", "The amount to approve")
  .setAction(
    async (
      taskArgs: {
        account: string;
        contractAddress: string;
        name: string;
        token: string;
        amount: string;
      },
      { ethers }
    ) => {
      const account = await ethers.getSigner(taskArgs.account);
      const contract: ERC20 = await ethers.getContractAt(
        taskArgs.name,
        taskArgs.contractAddress,
        account
      );

      const transaction = await contract.approve(
        taskArgs.token,
        taskArgs.amount
      );
      await transaction.wait();

      const allowance = await contract.allowance(
        account.address,
        taskArgs.token
      );
      if (allowance >= BigNumber.from(taskArgs.amount)) {
        console.log(`Approved ${taskArgs.amount} ${taskArgs.name} tokens`);
      } else {
        console.log(
          `Failed to approve ${taskArgs.amount} ${taskArgs.name} tokens`
        );
      }
    }
  );
