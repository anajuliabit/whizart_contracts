import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { expect, use } from "chai";
import { solidity } from "ethereum-waffle";
import { ethers, getChainId, upgrades } from "hardhat";
import { WArtist } from "types/contracts";
import { Rarity } from "utils/enums/rarity.enum";
import { networkConfig } from "utils/network";

use(solidity);

describe("WArtist", function () {
  let contract: WArtist;
  let user: SignerWithAddress, user2: SignerWithAddress;
  this.beforeEach(async () => {
    [user, user2] = await ethers.getSigners();
    const chainId = await getChainId();
    const { vrfCoordinator, linkToken, keyHash } = networkConfig[chainId];

    const contractFactory = await ethers.getContractFactory(
      "contracts/WArtist.sol:WArtist"
    );

    contract = (await upgrades.deployProxy(
      contractFactory,
      [vrfCoordinator, linkToken, keyHash],
      { kind: "uups" }
    )) as WArtist;

    await contract.deployed();
  });

  async function addAvailableURIs(rarity: Rarity, uris: string[]) {
    const tx = await contract.addAvailableURIs(rarity, uris);
    await tx.wait();
  }

  it("Should disable whitelist", async () => {
    await expect(contract.disableWhitelist())
      .emit(contract, "WhitelistStatusChanged")
      .withArgs(true, false);
  });

  it("Should enable whitelist", async () => {
    await contract.disableWhitelist();
    await expect(contract.enableWhitelist())
      .emit(contract, "WhitelistStatusChanged")
      .withArgs(false, true);
  });

  it("Should add address to whitelist", async () => {
    await contract.addWhitelist(user.address);
    expect(await contract.whitelist(user.address)).eq(true);
  });

  it("Should remove address from whitelist", async () => {
    await contract.addWhitelist(user.address);
    await contract.removeWhitelist(user.address);
    expect(await contract.whitelist(user.address)).eq(false);
  });

  it("Should add batch to whitelist", async () => {
    const addresses = [user.address, user2.address];
    await contract.addWhitelistBatch(addresses);
    expect(await contract.whitelist(user.address)).eq(true);
    expect(await contract.whitelist(user2.address)).eq(true);
  });

  it("Should remove batch from whitelist", async () => {
    const addresses = [user.address, user2.address];
    await contract.addWhitelistBatch(addresses);
    await contract.removeWhitelistBatch(addresses);
    expect(await contract.whitelist(user.address)).eq(false);
    expect(await contract.whitelist(user2.address)).eq(false);
  });

  it("Should add URI available to mint", async () => {
    await addAvailableURIs(Rarity.NOVICE, ["abc", "dfg"]);

    expect(await contract.notMintedURIs(Rarity.NOVICE, 0)).eq("abc");
  });

  it("Should remove the first URI from availables to mint", async () => {
    await addAvailableURIs(Rarity.NOVICE, ["abc", "dfg"]);

    const remove = await contract.removeAvailableURI(Rarity.NOVICE, 0);
    await remove.wait();
    expect(await contract.notMintedURIs(Rarity.NOVICE, 0)).eq("dfg");
  });

  it("Should remove the last URI from availables to mint", async () => {
    await addAvailableURIs(Rarity.NOVICE, ["abc", "dfg"]);

    const remove = await contract.removeAvailableURI(Rarity.NOVICE, 1);
    await remove.wait();

    await expect(contract.notMintedURIs(Rarity.NOVICE, 1)).to.be.reverted;
  });

  it("Should enable mint", async () => {
    const disable = await contract.disableMint();
    await disable.wait();

    const tx = await contract.enableMint();
    await tx.wait();

    await expect(tx).emit(contract, "MintActive").withArgs(false, true);
    expect(await contract.mintActive()).to.eq(true);
  });

  it("Should disable mint", async () => {
    const enable = await contract.enableMint();
    await enable.wait();

    const tx = await contract.disableMint();
    await tx.wait();

    await expect(tx).emit(contract, "MintActive").withArgs(true, false);
    expect(await contract.mintActive()).to.eq(false);
  });

  it("Should return baseURI", async () => {
    expect(await contract.baseURI()).to.eq("ipfs://");
  });

  // it.only("Should request mint", async () => {
  //   const disableWL = await contract.disableWhitelist();
  //   await disableWL.wait();

  //   await addAvailableURIs(Rarity.NOVICE, ["abc", "dfg"]);

  //   const mint = await contract.publicMint({
  //     value: ethers.utils.parseUnits("0.0001"),
  //   });
  //   await expect(mint).emit(contract, "CalledRandomGenerator").withArgs("");
  // });

  it.only("Should pause contract", async () => {
    const tx = await contract.pause();
    await tx.wait();
    expect(tx).to.returned(true);
    expect(contract.paused).to.be.eq(true);
  });
});
