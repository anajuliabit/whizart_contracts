import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { expect, use } from "chai";
import { solidity } from "ethereum-waffle";
import { ethers, upgrades } from "hardhat";
import { MAINTENANCE_ROLE, STAFF_ROLE } from "test/utils/constants";
import { WhizartWorkshop } from "types/contracts";

use(solidity);

describe("WhizartWorkshop", function () {
  let contract: WhizartWorkshop;
  let deployer: SignerWithAddress,
    user: SignerWithAddress,
    user2: SignerWithAddress;
  this.beforeEach(async () => {
    [deployer, user, user2] = await ethers.getSigners();
    const contractFactory = await ethers.getContractFactory("WhizartWorkshop");

    contract = (await upgrades.deployProxy(contractFactory, {
      kind: "uups",
    })) as WhizartWorkshop;

    await contract.deployed();
  });

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

  it("Should revert if addWhitelist caller has not the STAFF role", async () => {
    await expect(
      contract.connect(user).addWhitelist(user2.address)
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${STAFF_ROLE}`
    );
  });

  it("Should revert if addWhitelistBatch caller has not the STAFF role", async () => {
    await expect(
      contract.connect(user).addWhitelistBatch([user2.address])
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${STAFF_ROLE}`
    );
  });

  it("Should revert if removeWhitelist caller has not the STAFF role", async () => {
    await expect(
      contract.connect(user).removeWhitelist(user2.address)
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${STAFF_ROLE}`
    );
  });

  it("Should revert if removeWhitelistBatch caller has not the STAFF role", async () => {
    await expect(
      contract.connect(user).removeWhitelistBatch([user2.address])
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${STAFF_ROLE}`
    );
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
    expect(await contract.baseURI()).to.eq(
      "https://metadata-whizart.s3.sa-east-1.amazonaws.com/metadata/workshops/"
    );
  });

  it("Should pause contract", async () => {
    const tx = await contract.pause();
    await tx.wait();
    expect(await contract.paused()).to.be.eq(true);
  });

  it("Should unpause contract", async () => {
    const tx = await contract.pause();
    await tx.wait();

    const tx2 = await contract.unpause();
    await tx2.wait();
    expect(await contract.paused()).to.be.eq(false);
  });

  it("Should revert if pause caller has not the MAINTENANCE_ROLE", async () => {
    await expect(contract.connect(user2).pause()).to.be.revertedWith(
      `AccessControl: account ${user2.address.toLowerCase()} is missing role ${MAINTENANCE_ROLE}`
    );
  });

  it("Should revert if mint caller was not whitelisted", async () => {
    await expect(
      contract.connect(user).mint({ value: ethers.utils.parseUnits("0.0001") })
    ).to.be.revertedWith("Not whitelisted");
  });

  it("Should revert mint if mint is unavailable", async () => {
    await contract.disableMint();
    await expect(
      contract.connect(user).mint({ value: ethers.utils.parseUnits("0.0001") })
    ).to.be.revertedWith("Mint is not available");
  });

  it("Should revert mint if wrong amount of MATIC is sended", async () => {
    await expect(
      contract.connect(user).mint({ value: ethers.utils.parseUnits("0.0002") })
    ).to.be.revertedWith("Wrong amount of MATIC");

    await expect(
      contract.connect(user).mint({ value: ethers.utils.parseUnits("0.00005") })
    ).to.be.revertedWith("Wrong amount of MATIC");
  });

  it("Should mint with success", async () => {
    const balanceBefore = await ethers.provider.getBalance(contract.address);
    const balanceBeforeUser = await ethers.provider.getBalance(user.address);

    const value = ethers.utils.parseUnits("0.0001");
    await contract.addWhitelist(user.address);
    const mint = await contract.connect(user).mint({
      value,
    });
    await mint.wait();

    const balanceAfter = await ethers.provider.getBalance(contract.address);
    const balanceAfterUser = await ethers.provider.getBalance(user.address);

    await expect(mint)
      .to.emit(contract, "WorkshopMinted")
      .withArgs(user.address, 0);
    expect(await contract.balanceOf(user.address)).to.eq(1);
    expect(await contract.totalSupply()).to.eq(1);
    expect(balanceAfter.sub(balanceBefore)).to.be.at.least(value);
    expect(balanceBeforeUser.sub(balanceAfterUser)).to.be.at.least(value);
  });

  // it("Should sweepEthToAddress with success", async () => {
  //   const tx = await ethers.provider.sendTransaction({
  //     to: contract.address,
  //     value: ethers.utils.parseUnits("1"),
  //   });
  // });
});
