import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { WhizartToken } from "types/contracts";

describe("WhizArt Token", function () {
  let whiz: WhizartToken;
  let owner: SignerWithAddress, to: SignerWithAddress;

  this.beforeAll(async () => {
    [owner, to] = await ethers.getSigners();
    const WhizArtToken = await ethers.getContractFactory("WhizartToken");
    whiz = (await WhizArtToken.deploy(owner.address)) as WhizartToken;
    await whiz.deployed();
  });

  it("Should be an ERC20 token", async function () {
    await expect(whiz.transferFrom(owner.address, to.address, 1)).revertedWith(
      "ERC20: transfer amount exceeds allowance"
    );
  });

  it("Should have initial supply", async function () {
    expect(await whiz.totalSupply()).equal("100000000000000000000000000");
  });

  it("Should be pausable", async function () {
    await whiz.pause();

    await expect(whiz.transferFrom(owner.address, to.address, 1)).revertedWith(
      "Pausable: paused"
    );

    await whiz.unpause();

    await whiz.approve(owner.address, to.address);

    const tx = whiz.transferFrom(owner.address, to.address, 1);
    await expect(tx)
      .emit(whiz, "Transfer")
      .withArgs(owner.address, to.address, 1);
  });

  it("Should has a default admin", async function () {
    const [, notOwner] = await ethers.getSigners();

    await expect(whiz.connect(notOwner).pause()).revertedWith(
      `AccessControl: account ${notOwner.address.toLowerCase()} is missing role 0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a`
    );
  });

  it("Should be burnable", async function () {
    expect(await whiz.totalSupply()).equal("100000000000000000000000000");

    await whiz.burn("1");

    expect(await whiz.totalSupply()).equal("99999999999999999999999999");
  });
});
