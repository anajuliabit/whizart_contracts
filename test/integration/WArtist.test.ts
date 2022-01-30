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
  });

  it("Shoud add to whitelist", async () => {
    const addToWhitelist = await contract
      .connect(owner)
      .addWhitelist(user.address);
    await addToWhitelist.wait();

    const isWhitelisted = await contract.whitelist(user.address);

    expect(isWhitelisted).eq(true);
  });

  async function addURIByRarity(rarity: number, uris: string[]) {
    return contract.connect(owner).addURIAvailables(rarity, uris);
  }

  it("Shoud add URIs available by Rarity", async () => {
    await addURIByRarity(0, [
      "bafkreifnn3erf3hlv7n7klejuy7f7n5fjoc7ddekpwv6jqa3aeyrfcvtre",
      "bafkreia3w64fe4inft6v7pzshlul7zfth6eoci2pkv6eks7mrb3fnbeb4m",
    ])
      .then((tx) => tx.wait())
      .then(() =>
        addURIByRarity(1, [
          "bafkreifnn3erf3hlv7n7klejuy7f7n5fjoc7ddekpwv6jqa3aeyrfcvtre",
          "ipfs://bafkreia3w64fe4inft6v7pzshlul7zfth6eoci2pkv6eks7mrb3fnbeb4m",
        ])
      )
      .then((tx) => tx.wait())
      .then(() =>
        addURIByRarity(2, [
          "bafkreifnn3erf3hlv7n7klejuy7f7n5fjoc7ddekpwv6jqa3aeyrfcvtre",
          "bafkreia3w64fe4inft6v7pzshlul7zfth6eoci2pkv6eks7mrb3fnbeb4m",
        ])
      )
      .then((tx) => tx.wait())
      .then(() =>
        addURIByRarity(3, [
          "bafkreifnn3erf3hlv7n7klejuy7f7n5fjoc7ddekpwv6jqa3aeyrfcvtre",
          "bafkreia3w64fe4inft6v7pzshlul7zfth6eoci2pkv6eks7mrb3fnbeb4m",
        ])
      )
      .then((tx) => tx.wait())
      .then(() =>
        addURIByRarity(4, [
          "bafkreifnn3erf3hlv7n7klejuy7f7n5fjoc7ddekpwv6jqa3aeyrfcvtre",
          "bafkreia3w64fe4inft6v7pzshlul7zfth6eoci2pkv6eks7mrb3fnbeb4m",
        ])
      )
      .then((tx) => tx.wait());

    const firstURINovice = await contract.artistsURIByRarity(0, 0);

    expect(Number(firstURINovice)).eq(1);
  });

  it("Should successfully mint a Artist", async () => {
    const transaction = await contract
      .connect(user)
      .publicMint({ value: ethers.utils.parseUnits("0.0001") });
    await transaction.wait();

    await new Promise((resolve) => setTimeout(resolve, 60000));
    const balance = await contract.balanceOf(user.address);
    expect(Number(balance)).eq(1);
  });
});
