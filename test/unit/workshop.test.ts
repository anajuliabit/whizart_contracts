import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { expect, use } from "chai";
import { solidity } from "ethereum-waffle";
import { ContractTransaction } from "ethers";
import { ethers, upgrades } from "hardhat";
import {
  DEFAULT_ADMIN_ROLE,
  DESIGNER_ROLE,
  MAINTENANCE_ROLE,
  MINT_PRICE_WORKSHOP,
  STAFF_ROLE,
} from "test/utils/constants";
import { WhizartWorkshop } from "types/contracts";

use(solidity);

const baseURI =
  "https://metadata-whizart.s3.sa-east-1.amazonaws.com/metadata/workshops/";

describe("WhizartWorkshop", function () {
  let contract: WhizartWorkshop;
  let deployer: SignerWithAddress,
    user: SignerWithAddress,
    user2: SignerWithAddress,
    treasury: SignerWithAddress;
  this.beforeEach(async () => {
    [deployer, user, user2, treasury] = await ethers.getSigners();
    const contractFactory = await ethers.getContractFactory("WhizartWorkshop");

    contract = (await upgrades.deployProxy(contractFactory, {
      kind: "uups",
    })) as WhizartWorkshop;

    await contract.deployed();
  });

  async function mint(
    to: SignerWithAddress,
    spaceBetweenBlocks = 2
  ): Promise<{
    mintTransaction: ContractTransaction;
    processTransaction: ContractTransaction;
  }> {
    const isWhitelisted = await contract.whitelist(to.address);
    if (!isWhitelisted) {
      await contract.connect(deployer).addWhitelist(to.address);
    }

    const tx = await contract.connect(to).mint({
      value: MINT_PRICE_WORKSHOP,
    });
    await tx.wait();

    for (let index = 0; index < spaceBetweenBlocks; index++) {
      await ethers.provider.send("evm_mine", []);
    }

    const processRequest = await contract.connect(user).processMintRequest();
    await processRequest.wait();
    return { mintTransaction: tx, processTransaction: processRequest };
  }

  it("Should return baseURI", async () => {
    expect(await contract.baseURI()).to.eq(baseURI);
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
      contract.connect(user).mint({ value: MINT_PRICE_WORKSHOP })
    ).to.be.revertedWith("Not whitelisted");
  });

  it("Should revert mint if mint is unavailable", async () => {
    await contract.disableMint();
    await expect(
      contract.connect(user).mint({ value: MINT_PRICE_WORKSHOP })
    ).to.be.revertedWith("Mint is not available");
  });

  it("Should revert mint if wrong amount of BNB is sended", async () => {
    await expect(
      contract.connect(user).mint({ value: ethers.utils.parseUnits("0.0002") })
    ).to.be.revertedWith("Wrong amount of BNB");

    await expect(
      contract.connect(user).mint({ value: ethers.utils.parseUnits("0.00005") })
    ).to.be.revertedWith("Wrong amount of BNB");
  });

  it("Should sweepBnbToAddress with success", async () => {
    const value = ethers.utils.parseUnits("1");
    const tx = await user.sendTransaction({
      to: contract.address,
      value,
    });
    await tx.wait();

    const balanceBefore = await ethers.provider.getBalance(contract.address);

    const refund = await contract.sweepBnbToAddress(user.address, value);
    await refund.wait();

    const balanceAfter = await ethers.provider.getBalance(contract.address);
    expect(balanceBefore.sub(balanceAfter)).to.be.eq(value);
  });

  it("Should revert if sweepBnbToAddress caller has not DEFAULT_ADMIN_ROLE", async () => {
    const value = ethers.utils.parseUnits("1");
    const tx = await user.sendTransaction({
      to: contract.address,
      value,
    });
    await tx.wait();

    await expect(
      contract.connect(user2).sweepBnbToAddress(user.address, value)
    ).to.be.revertedWith(
      `AccessControl: account ${user2.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
    );
  });

  it("Should withdraw with success", async () => {
    await mint(user);
    const balanceBefore = await ethers.provider.getBalance(treasury.address);

    const tx = await contract.withdraw(treasury.address, MINT_PRICE_WORKSHOP);
    await tx.wait();

    const balanceAfter = await ethers.provider.getBalance(treasury.address);
    await expect(tx)
      .to.emit(contract, "Withdraw")
      .withArgs(treasury.address, MINT_PRICE_WORKSHOP);
    expect(await ethers.provider.getBalance(contract.address)).to.eq(0);
    expect(balanceAfter.sub(balanceBefore)).to.at.least(MINT_PRICE_WORKSHOP);
  });

  it("Should revert if withdraw caller has not DEFAULT_ADMIN_ROLE", async () => {
    await expect(
      contract.connect(user2).withdraw(treasury.address, MINT_PRICE_WORKSHOP)
    ).to.be.revertedWith(
      `AccessControl: account ${user2.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
    );
  });

  it("Should revert if contract hasn't withdraw amount", async () => {
    await expect(
      contract.connect(deployer).withdraw(treasury.address, MINT_PRICE_WORKSHOP)
    ).to.be.revertedWith("Invalid amount");
  });

  it("Should not be able to change mint price if caller hasn't DEFAULT_ADMIN_ROLE", async () => {
    await expect(
      contract.connect(user).setMintPrice(MINT_PRICE_WORKSHOP)
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
    );
  });

  it("Should revert if mint caller was not whitelisted", async () => {
    await expect(
      contract.connect(user).mint({ value: MINT_PRICE_WORKSHOP })
    ).to.be.revertedWith("Not whitelisted");
  });

  it("Should revert mint if mint is unavailable", async () => {
    await contract.disableMint();
    await expect(
      contract.connect(user).mint({ value: MINT_PRICE_WORKSHOP })
    ).to.be.revertedWith("Mint is not available");
  });

  it("Should revert mint if wrong amount of BNB is sended", async () => {
    await expect(
      contract.connect(user).mint({ value: ethers.utils.parseUnits("0.0002") })
    ).to.be.revertedWith("Wrong amount of BNB");

    await expect(
      contract.connect(user).mint({ value: ethers.utils.parseUnits("0.00005") })
    ).to.be.revertedWith("Wrong amount of BNB");
  });

  it("Should set mint price with success", async () => {
    const newPrice = ethers.utils.parseUnits("1");
    const tx = await contract.setMintPrice(newPrice);
    await tx.wait();

    await expect(tx)
      .to.emit(contract, "PriceChanged")
      .withArgs(MINT_PRICE_WORKSHOP, newPrice);
    expect(await contract.getMintPrice()).to.eq(newPrice);
  });

  it("Should mint with success", async () => {
    const balanceBefore = await ethers.provider.getBalance(contract.address);
    const balanceBeforeUser = await ethers.provider.getBalance(user.address);

    const blockNumber = await ethers.provider.getBlockNumber();

    const { mintTransaction, processTransaction } = await mint(user);

    const balanceAfter = await ethers.provider.getBalance(contract.address);
    const balanceAfterUser = await ethers.provider.getBalance(user.address);

    await expect(mintTransaction)
      .to.emit(contract, "MintRequested")
      .withArgs(user.address, blockNumber + 3);
    await expect(processTransaction)
      .to.emit(contract, "TokenMinted")
      .withArgs(user.address, 0);
    expect(await contract.balanceOf(user.address)).to.eq(1);
    expect(await contract.totalSupply()).to.eq(1);
    expect(await contract.supplyAvailable()).to.eq(9);
    expect(balanceAfter.sub(balanceBefore)).to.be.at.least(MINT_PRICE_WORKSHOP);
    expect(balanceBeforeUser.sub(balanceAfterUser)).to.be.at.least(
      MINT_PRICE_WORKSHOP
    );
  });

  it("Should mint with success if target block is 256 blocks before current block ", async () => {
    const balanceBefore = await ethers.provider.getBalance(contract.address);
    const balanceBeforeUser = await ethers.provider.getBalance(user.address);

    const blockNumber = await ethers.provider.getBlockNumber();

    const { mintTransaction, processTransaction } = await mint(user, 257);

    const balanceAfter = await ethers.provider.getBalance(contract.address);
    const balanceAfterUser = await ethers.provider.getBalance(user.address);

    await expect(mintTransaction)
      .to.emit(contract, "MintRequested")
      .withArgs(user.address, blockNumber + 3);
    await expect(processTransaction)
      .to.emit(contract, "TokenMinted")
      .withArgs(user.address, 0);
    expect(await contract.balanceOf(user.address)).to.eq(1);
    expect(await contract.totalSupply()).to.eq(1);
    expect(await contract.supplyAvailable()).to.eq(9);
    expect(balanceAfter.sub(balanceBefore)).to.be.at.least(MINT_PRICE_WORKSHOP);
    expect(balanceBeforeUser.sub(balanceAfterUser)).to.be.at.least(
      MINT_PRICE_WORKSHOP
    );
  });

  it("Should change baseURI with success", async () => {
    const newBaseURI = "https://new-base-uri.com";
    const tx = await contract.setBaseURI(newBaseURI);
    await tx.wait();

    await expect(tx)
      .to.emit(contract, "BaseURIChanged")
      .withArgs(
        "https://metadata-whizart.s3.sa-east-1.amazonaws.com/metadata/workshops/",
        newBaseURI
      );
  });

  it("Should not be able to change baseURI if caller hasn't DEFAULT_ADMIN_ROLE", async () => {
    await expect(
      contract.connect(user).setBaseURI("https://new-base-uri.com")
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
    );
  });

  it("Should change supply available with success", async () => {
    const tx = await contract.setSupplyAvailable(100);
    await tx.wait();

    await expect(tx)
      .to.emit(contract, "SupplyAvailableChanged")
      .withArgs(10, 100);
    expect(await contract.supplyAvailable()).to.eq(100);
  });

  it("Should not be able to change supply available if caller hasn't DESIGNER_ROLE", async () => {
    await expect(
      contract.connect(user).setSupplyAvailable(100)
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${DESIGNER_ROLE}`
    );
  });

  it("Should change mint amount with success", async () => {
    const tx = await contract.setMintAmount(3);
    await tx.wait();

    await expect(tx).to.emit(contract, "MintAmountChanged").withArgs(2, 3);
  });

  it("Should not be able to change mint amount if caller hasn't DESIGNER_ROLE", async () => {
    await expect(contract.connect(user).setMintAmount(3)).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${DESIGNER_ROLE}`
    );
  });

  it("Should return workshop details from owner", async () => {
    await mint(user);

    const workshops = await contract.getTokenDetailsByOwner(user.address);
    expect(workshops.length).to.eq(1);
    expect(workshops[0].level).to.eq(1);
  });

  it("Should return token URI with success", async () => {
    await mint(user);

    const uri = await contract.tokenURI(0);
    expect(uri).to.eq(`${baseURI}0`);
  });

  it("Should change drop rate with success", async () => {
    const tx = await contract.setDropRate([500, 300, 100]);
    await tx.wait();

    const dropRate = await contract.getDropRate();

    await expect(tx)
      .to.emit(contract, "DropRateChanged")
      .withArgs([60, 28, 12], [500, 300, 100]);
    expect(dropRate.length).to.be.eq(3);
  });

  it("Should return drop rate", async () => {
    const dropRate = await contract.getDropRate();
    await expect(dropRate.length).to.be.eq(3);
  });

  it("Should revert mint if max amount by user already reached", async () => {
    await mint(user);
    await mint(user);
    await expect(
      contract.connect(user).mint({ value: MINT_PRICE_WORKSHOP })
    ).to.be.revertedWith("User limit reached");
  });
});
