import { ethers } from "hardhat";
import { task } from "hardhat/config";
import { WhizartArtist } from "types/contracts";
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

      const contract: WhizartArtist = await ethers.getContractAt(
        "Wartist",
        taskArgs.implementation,
        taskArgs.address
      );
      contract.attach(proxy.proxies[-1].address);

      const request = await contract.connect(taskArgs.address).mint();
      await request.wait();
    }
  );
