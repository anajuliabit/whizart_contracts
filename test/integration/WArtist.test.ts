import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { expect } from "chai";
import { deployments, ethers, getChainId, network } from "hardhat";

import { ERC20, WArtist } from "../../types/contracts";
import { Proxy } from "../../types/proxy";
import { autoFundCheck, networkConfig } from "../../utils/helper";

describe("WArtist Integration Tests", function () {
  let contract: WArtist;
  let stableCoin: ERC20;
  let chainId: string;
  let owner: SignerWithAddress, user: SignerWithAddress;

  beforeEach(async () => {
    chainId = await getChainId();
    const { stableCoinAddress } = networkConfig[chainId];
    if (!stableCoinAddress) {
      throw new Error("Missing address for this network");
    }

    [owner, user] = await ethers.getSigners();

    const deployment = await deployments.get("WArtist");

    contract = await ethers.getContractAt("Wartist", deployment.address, owner);

    // delegates call to proxy contract
    const proxy = (await import(
      `.openzeppellin/${network.name}.json`
    )) as Proxy;
    contract.attach(proxy.proxies[-1].address);

    stableCoin = await ethers.getContractAt("ERC20", stableCoinAddress, user);
    await stableCoin.approve(contract.address, "1000000000");

    const contractHasLink = await autoFundCheck(
      contract.address,
      network.name,
      networkConfig[chainId].linkToken as string
    );
    if (!contractHasLink) {
      throw new Error("Contract has no link token");
    }
  });

  it("Should successfully mint a Artist", async () => {
    const addToWhitelist = await contract.addToWhitelist([user.address]);
    await addToWhitelist.wait();

    await stableCoin.connect(user).approve(contract.address, "1000000000");

    const transaction = await contract
      .connect(user)
      .mintWhitelist("500000000000000000000");
    const txReceipt = await transaction.wait();
    const events = txReceipt.events;
    console.log(events);

    // wait 60 secs for oracle to callback
    await new Promise((resolve) => setTimeout(resolve, 60000));

    console.log(await contract.randomNumberGenerated());
    expect(await contract.balanceOf(user.address)).eq(1);
  });
});
