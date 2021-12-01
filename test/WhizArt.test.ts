import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";

describe("WhizArt Token", function () {
  let whiz: Contract
  let owner: SignerWithAddress, to: SignerWithAddress 
  
  this.beforeAll(async () => {
    [owner, to] = await ethers.getSigners();
    const WhizArtToken = await ethers.getContractFactory("WhizArt");
    whiz = await WhizArtToken.deploy(owner.address);
    await whiz.deployed();
  })

  it("Should be an ERC20 token", async function () {
    await expect(
      whiz.transferFrom(owner.address, to.address, 1)
    ).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
  });

  it("Should have initial supply", async function () {
    expect(await whiz.totalSupply()).to.equal("100000000000000000000000000");
  });

  it("Should be pausable", async function () {
    await whiz.pause();

    await expect(
      whiz.transferFrom(owner.address, to.address, 1)
    ).to.be.revertedWith("Pausable: paused");

    await whiz.unpause();

    await whiz.approve(owner.address, to.address);

    const tx = whiz.transferFrom(owner.address, to.address, 1);
    await expect(tx)
      .to.emit(whiz, "Transfer")
      .withArgs(owner.address, to.address, 1);
  });
  
  it("Should be ownable", async function () {

    const [, notOwner] = await ethers.getSigners();

    await expect(whiz.connect(notOwner).pause()).to.be.revertedWith(
      `AccessControl: account ${notOwner.address.toLowerCase()} is missing role 0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a`
    );
  });
  
  it("Should be burnable", async function () {

    expect(await whiz.totalSupply()).to.equal("100000000000000000000000000");

    await whiz.burn("1");

    expect(await whiz.totalSupply()).to.equal("99999999999999999999999999");
  });
});