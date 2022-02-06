import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { expect } from "chai";
import { ethers, getNamedAccounts, network } from "hardhat";
import { Proxy } from "types/proxy";
import { WArtist } from "../../types/contracts";

// Run this test only in development network
// It's necessary that the deployed contract has LINK (faucet)

describe("WArtist Integration Tests", function () {
  let contract: WArtist;
  let owner: SignerWithAddress, user: SignerWithAddress;

  function addURIByRarity(rarity: number, uris: string[]) {
    return contract.connect(owner).addAvailableURIs(rarity, uris);
  }

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
    const WArtistContract: WArtist = await ethers.getContractAt(
      "WArtist",
      proxy.impls[implKeys[implKeys.length - 1]].address
    );

    // delegates call to proxy contract
    contract = WArtistContract.attach(
      proxy.proxies[proxy.proxies.length - 1].address
    );

    await addURIByRarity(0, [
      "bafkreide3yekzsbxgakge5j7qkgwvddhigjjoxao2so64neh7v624zp4jm",
      "bafkreie3aq3kllp347gb53izfl3nubs2rgw6qbtkqh3lsbpm7jc7f27uqq",
    ]);
    await addURIByRarity(1, [
      "bafkreide3yekzsbxgakge5j7qkgwvddhigjjoxao2so64neh7v624zp4jm",
      "bafkreie3aq3kllp347gb53izfl3nubs2rgw6qbtkqh3lsbpm7jc7f27uqq",
    ]);
    await addURIByRarity(2, [
      "bafkreide3yekzsbxgakge5j7qkgwvddhigjjoxao2so64neh7v624zp4jm",
      "bafkreie3aq3kllp347gb53izfl3nubs2rgw6qbtkqh3lsbpm7jc7f27uqq",
    ]);
    await addURIByRarity(3, [
      "bafkreide3yekzsbxgakge5j7qkgwvddhigjjoxao2so64neh7v624zp4jm",
      "bafkreie3aq3kllp347gb53izfl3nubs2rgw6qbtkqh3lsbpm7jc7f27uqq",
    ]);
    await addURIByRarity(4, [
      "bafkreide3yekzsbxgakge5j7qkgwvddhigjjoxao2so64neh7v624zp4jm",
      "bafkreie3aq3kllp347gb53izfl3nubs2rgw6qbtkqh3lsbpm7jc7f27uqq",
    ]);
  });

  it("Shoud add to whitelist", async () => {
    const addToWhitelist = await contract
      .connect(owner)
      .addWhitelist(user.address);
    await addToWhitelist.wait();

    const isWhitelisted = await contract.whitelist(user.address);

    expect(isWhitelisted).eq(true);
  });

  it.only("Should successfully mint a Artist", async () => {
    this.timeout(0);
    const transaction = await contract
      .connect(user)
      .publicMint({ value: ethers.utils.parseUnits("0.0001") });
    await transaction.wait();

    await new Promise((resolve) => setTimeout(resolve, 60000));
    const balance = await contract.balanceOf(user.address);
    expect(Number(balance)).eq(1);
  });
});
