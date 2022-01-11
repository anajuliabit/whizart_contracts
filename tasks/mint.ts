import { ethers } from "hardhat";
import { task } from "hardhat/config";
import { WArtist } from "types/contracts";
import { Proxy } from "types/proxy";

task("mint", "Mint an Artist")
  .addOptionalPositionalParam("network", "The network to mint")
  .addPositionalParam("sender", "The account's sender address")
  .addPositionalParam(
    "contractImplementation",
    "The contract implementation address"
  )
  .setAction(
    async (taskArgs: {
      address: string;
      network: string;
      implementation: string;
    }) => {
      const proxy = (await import(
        `.openzeppellin/${taskArgs.network}.json`
      )) as Proxy;

      const contract: WArtist = await ethers.getContractAt(
        "Wartist",
        taskArgs.implementation,
        taskArgs.address
      );
      contract.attach(proxy.proxies[-1].address);

      const request = await contract
        .connect(taskArgs.address)
        .mintWhitelist("500000000");
      await request.wait();
    }
  );
