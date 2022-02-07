/* eslint-disable @typescript-eslint/no-unsafe-call */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { expect } from "chai";
import { ethers, getNamedAccounts, network } from "hardhat";
import { Proxy } from "types/proxy";
import { WhizartWorkshop } from "../../types/contracts";

// Run this test only in development network

describe("WArtist Integration Tests", function () {
  let contract: WhizartWorkshop;
  let owner: SignerWithAddress, user: SignerWithAddress;

  this.beforeAll(async () => {
    if (
      network.name !== "rinkeby" &&
      network.name !== "hardhat" &&
      network.name !== "localhost" &&
      network.name !== "mumbai"
    ) {
      throw new Error("Run this test only in development network");
    }

    const { beneficiary, deployer } = await getNamedAccounts();
    owner = await ethers.getSigner(deployer);
    user = await ethers.getSigner(beneficiary);

    const proxy = (await import(
      `../../.openzeppelin/unknown-80001.json`
    )) as Proxy;

    const implKeys = Object.keys(proxy.impls);
    const Workshop: WhizartWorkshop = await ethers.getContractAt(
      "WhizartWorkshop",
      proxy.impls[implKeys[implKeys.length - 1]].address
    );

    // delegates call to proxy contract
    contract = Workshop.attach(proxy.proxies[proxy.proxies.length - 1].address);

    console.log(contract.address);
  });

  it("Shoud add to whitelist", async () => {
    const addToWhitelist = await contract
      .connect(owner)
      .addWhitelist(user.address);
    await addToWhitelist.wait();

    const isWhitelisted = await contract.whitelist(user.address);

    expect(isWhitelisted).eq(true);
  });

  it("Should successfully mint a Workshop", async () => {
    this.timeout(0);
    const transaction = await contract
      .connect(user)
      .mint({ value: ethers.utils.parseUnits("0.0001") });
    await transaction.wait();

    const balance = await contract.balanceOf(user.address);
    expect(Number(balance)).eq(1);
  });
});
