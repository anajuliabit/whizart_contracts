import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { expect, use } from "chai";
import { solidity } from "ethereum-waffle";
import { ContractTransaction } from "ethers";
import { ethers, upgrades } from "hardhat";
import { WhizartPaint } from "types/contracts";

use(solidity);

describe("WhizartPaint", function () {
  let contract: WhizartPaint;
  let deployer: SignerWithAddress,
    user: SignerWithAddress,
    user2: SignerWithAddress,
    treasury: SignerWithAddress;
  this.beforeEach(async () => {
    [deployer, user, user2, treasury] = await ethers.getSigners();

    const contractFactory = await ethers.getContractFactory("WhizartPaint");

    contract = (await upgrades.deployProxy(contractFactory, [], {
      kind: "uups",
    })) as WhizartPaint;

    await contract.deployed();
  });

  async function addClaimableTokens(
    recipients: { to: string; quantity: number }[],
    paintType: number
  ): Promise<ContractTransaction> {
    const tx = await contract
      .connect(deployer)
      .addClaimableTokens(recipients, paintType);
    await tx.wait();
    return tx;
  }

  it("Should add claimable tokens", async () => {
    await addClaimableTokens(
      [
        { to: user.address, quantity: 1 },
        { to: user2.address, quantity: 1 },
      ],
      5
    );
    expect(await contract.getClaimableTokens(user.address)).to.be.eq(1);
    expect(await contract.getClaimableTokens(user2.address)).to.be.eq(1);
  });

  it("Should remove claimableTokens", async () => {
    await addClaimableTokens([{ to: user.address, quantity: 1 }], 0);

    await contract.decreaseClaimableTokens(
      [{ to: user.address, quantity: 1 }],
      0
    );
    expect(await contract.getClaimableTokens(user.address)).to.be.eq(0);
  });

  it("Should reject if remove claimable tokens bigger than actual claimable tokens ", async () => {
    await addClaimableTokens([{ to: user.address, quantity: 1 }], 2);

    await expect(
      contract.decreaseClaimableTokens([{ to: user.address, quantity: 1 }], 5)
    ).to.be.revertedWith(
      "panic code 0x11 (Arithmetic operation underflowed or overflowed outside of an unchecked block)"
    );
  });

  it("Should claim with success", async () => {
    await addClaimableTokens([{ to: user.address, quantity: 6 }], 0);

    const blockNumber = await ethers.provider.getBlockNumber();
    const tx = await contract.connect(user).claim();
    await tx.wait();

    for (let index = 0; index < 5; index++) {
      await ethers.provider.send("evm_mine", []);
    }

    const processRequest = await contract.connect(user).processMintRequest();
    await processRequest.wait();

    const balance1 = Number(await contract.balanceOf(user.address, 1));
    const balance2 = Number(await contract.balanceOf(user.address, 2));
    const balance3 = Number(await contract.balanceOf(user.address, 3));
    const balance4 = Number(await contract.balanceOf(user.address, 4));
    const balance5 = Number(await contract.balanceOf(user.address, 5));

    await expect(tx)
      .to.emit(contract, "MintRequested")
      .withArgs(user.address, blockNumber + 2, 6, 0);
    await expect(processRequest).to.emit(contract, "TokenMinted");
    expect(balance1 + balance2 + balance3 + balance4 + balance5).to.eq(6);
  });

  // async function mint(
  //   to: SignerWithAddress,
  //   spaceBetweenBlocks = 2
  // ): Promise<{
  //   mintTransaction: ContractTransaction;
  //   processTransaction: ContractTransaction;
  // }> {
  //   const tx = await contract.connect(to).mint({
  //     value: MINT_PRICE_ARTIST,
  //   });
  //   await tx.wait();

  //   for (let index = 0; index < spaceBetweenBlocks; index++) {
  //     await ethers.provider.send("evm_mine", []);
  //   }

  //   const processRequest = await contract.connect(user).processMintRequest();
  //   await processRequest.wait();
  //   return { mintTransaction: tx, processTransaction: processRequest };
  // }

  // it("Should return baseURI", async () => {
  //   expect(await contract.baseURI()).to.eq(baseURI);
  // });

  // it("Should enable mint", async () => {
  //   const disable = await contract.disableMint();
  //   await disable.wait();

  //   const tx = await contract.enableMint();
  //   await tx.wait();

  //   await expect(tx).emit(contract, "MintActive").withArgs(false, true);
  //   expect(await contract.mintActive()).to.eq(true);
  // });

  // it("Should disable mint", async () => {
  //   const enable = await contract.enableMint();
  //   await enable.wait();

  //   const tx = await contract.disableMint();
  //   await tx.wait();

  //   await expect(tx).emit(contract, "MintActive").withArgs(true, false);
  //   expect(await contract.mintActive()).to.eq(false);
  // });

  // it("Should pause contract", async () => {
  //   const tx = await contract.pause();
  //   await tx.wait();
  //   expect(await contract.paused()).to.be.eq(true);
  // });

  // it("Should unpause contract", async () => {
  //   const tx = await contract.pause();
  //   await tx.wait();

  //   const tx2 = await contract.unpause();
  //   await tx2.wait();
  //   expect(await contract.paused()).to.be.eq(false);
  // });

  // it("Should revert if pause caller has not the MAINTENANCE_ROLE", async () => {
  //   await expect(contract.connect(user2).pause()).to.be.revertedWith(
  //     `AccessControl: account ${user2.address.toLowerCase()} is missing role ${MAINTENANCE_ROLE}`
  //   );
  // });

  // it("Should revert mint if mint is unavailable", async () => {
  //   await contract.disableMint();
  //   await expect(
  //     contract.connect(user).mint({ value: ethers.utils.parseUnits("0.0001") })
  //   ).to.be.revertedWith("Mint is not available");
  // });

  // it("Should revert mint if wrong amount of BNB is sended", async () => {
  //   await expect(
  //     contract.connect(user).mint({ value: ethers.utils.parseUnits("0.0002") })
  //   ).to.be.revertedWith("Wrong amount of BNB");

  //   await expect(
  //     contract.connect(user).mint({ value: ethers.utils.parseUnits("0.00005") })
  //   ).to.be.revertedWith("Wrong amount of BNB");
  // });

  // it("Should sweepEthToAddress with success", async () => {
  //   const value = ethers.utils.parseUnits("1");
  //   const tx = await user.sendTransaction({
  //     to: contract.address,
  //     value,
  //   });
  //   await tx.wait();

  //   const balanceBefore = await ethers.provider.getBalance(contract.address);

  //   const refund = await contract.sweepBnbToAddress(user.address, value);
  //   await refund.wait();

  //   const balanceAfter = await ethers.provider.getBalance(contract.address);
  //   expect(balanceBefore.sub(balanceAfter)).to.be.eq(value);
  // });

  // it("Should revert if.sweepBnbToAddress caller has not DEFAULT_ADMIN_ROLE", async () => {
  //   const value = ethers.utils.parseUnits("1");
  //   const tx = await user.sendTransaction({
  //     to: contract.address,
  //     value,
  //   });
  //   await tx.wait();

  //   await expect(
  //     contract.connect(user2).sweepBnbToAddress(user.address, value)
  //   ).to.be.revertedWith(
  //     `AccessControl: account ${user2.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
  //   );
  // });

  // it("Should withdraw with success", async () => {
  //   await mint(user);
  //   const balanceBefore = await ethers.provider.getBalance(treasury.address);

  //   const tx = await contract.withdraw(treasury.address, MINT_PRICE_ARTIST);
  //   await tx.wait();

  //   const balanceAfter = await ethers.provider.getBalance(treasury.address);
  //   await expect(tx)
  //     .to.emit(contract, "Withdraw")
  //     .withArgs(treasury.address, MINT_PRICE_ARTIST);
  //   expect(await ethers.provider.getBalance(contract.address)).to.eq(0);
  //   expect(balanceAfter.sub(balanceBefore)).to.at.least(MINT_PRICE_ARTIST);
  // });

  // it("Should revert if withdraw caller has not DEFAULT_ADMIN_ROLE", async () => {
  //   await expect(
  //     contract.connect(user2).withdraw(treasury.address, MINT_PRICE_ARTIST)
  //   ).to.be.revertedWith(
  //     `AccessControl: account ${user2.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
  //   );
  // });

  // it("Should revert if contract hasn't withdraw amount", async () => {
  //   await expect(
  //     contract.connect(deployer).withdraw(treasury.address, MINT_PRICE_ARTIST)
  //   ).to.be.revertedWith("Invalid amount");
  // });

  // it("Should not be able to change mint price if caller hasn't DEFAULT_ADMIN_ROLE", async () => {
  //   await expect(
  //     contract.connect(user).setMintPrice(MINT_PRICE_ARTIST)
  //   ).to.be.revertedWith(
  //     `AccessControl: account ${user.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
  //   );
  // });

  // it("Should revert if mint caller was not whitelisted", async () => {
  //   await expect(
  //     contract.connect(user).mint({ value: MINT_PRICE_ARTIST })
  //   ).to.be.revertedWith("Not whitelisted");
  // });

  // it("Should revert mint if mint is unavailable", async () => {
  //   await contract.disableMint();
  //   await expect(
  //     contract.connect(user).mint({ value: MINT_PRICE_ARTIST })
  //   ).to.be.revertedWith("Mint is not available");
  // });

  // it("Should revert mint if wrong amount of BNB is sended", async () => {
  //   await expect(
  //     contract.connect(user).mint({ value: ethers.utils.parseUnits("0.0002") })
  //   ).to.be.revertedWith("Wrong amount of BNB");

  //   await expect(
  //     contract.connect(user).mint({ value: ethers.utils.parseUnits("0.00005") })
  //   ).to.be.revertedWith("Wrong amount of BNB");
  // });

  // it("Should set mint price with success", async () => {
  //   const newPrice = ethers.utils.parseUnits("1");
  //   const tx = await contract.setMintPrice(newPrice);
  //   await tx.wait();

  //   await expect(tx)
  //     .to.emit(contract, "PriceChanged")
  //     .withArgs(MINT_PRICE_ARTIST, newPrice);
  //   expect(await contract.getMintPrice()).to.eq(newPrice);
  // });

  // it("Should mint with success", async () => {
  //   const balanceBefore = await ethers.provider.getBalance(contract.address);
  //   const balanceBeforeUser = await ethers.provider.getBalance(user.address);

  //   const blockNumber = await ethers.provider.getBlockNumber();

  //   const { mintTransaction, processTransaction } = await mint(user);

  //   const balanceAfter = await ethers.provider.getBalance(contract.address);
  //   const balanceAfterUser = await ethers.provider.getBalance(user.address);

  //   await expect(mintTransaction)
  //     .to.emit(contract, "MintRequested")
  //     .withArgs(user.address, blockNumber + 3);
  //   await expect(processTransaction)
  //     .to.emit(contract, "TokenMinted")
  //     .withArgs(user.address, 0);
  //   expect(await contract.balanceOf(user.address)).to.eq(1);
  //   expect(await contract.totalSupply()).to.eq(1);
  //   expect(await contract.supplyAvailable()).to.eq(999);
  //   expect(balanceAfter.sub(balanceBefore)).to.be.at.least(MINT_PRICE_ARTIST);
  //   expect(balanceBeforeUser.sub(balanceAfterUser)).to.be.at.least(
  //     MINT_PRICE_ARTIST
  //   );
  // });

  // it("Should mint with success if target block is 256 blocks before current block ", async () => {
  //   const balanceBefore = await ethers.provider.getBalance(contract.address);
  //   const balanceBeforeUser = await ethers.provider.getBalance(user.address);

  //   const blockNumber = await ethers.provider.getBlockNumber();

  //   const { mintTransaction, processTransaction } = await mint(user, 257);

  //   const balanceAfter = await ethers.provider.getBalance(contract.address);
  //   const balanceAfterUser = await ethers.provider.getBalance(user.address);

  //   await expect(mintTransaction)
  //     .to.emit(contract, "MintRequested")
  //     .withArgs(user.address, blockNumber + 3);
  //   await expect(processTransaction)
  //     .to.emit(contract, "TokenMinted")
  //     .withArgs(user.address, 0);
  //   expect(await contract.balanceOf(user.address)).to.eq(1);
  //   expect(await contract.totalSupply()).to.eq(1);
  //   expect(await contract.supplyAvailable()).to.eq(999);
  //   expect(balanceAfter.sub(balanceBefore)).to.be.at.least(MINT_PRICE_ARTIST);
  //   expect(balanceBeforeUser.sub(balanceAfterUser)).to.be.at.least(
  //     MINT_PRICE_ARTIST
  //   );
  // });

  // it("Should change baseURI with success", async () => {
  //   const newBaseURI = "https://new-base-uri.com";
  //   const tx = await contract.setBaseURI(newBaseURI);
  //   await tx.wait();

  //   await expect(tx)
  //     .to.emit(contract, "BaseURIChanged")
  //     .withArgs(
  //       "https://metadata-whizart.s3.sa-east-1.amazonaws.com/metadata/artists/",
  //       newBaseURI
  //     );
  // });

  // it("Should not be able to change baseURI if caller hasn't DEFAULT_ADMIN_ROLE", async () => {
  //   await expect(
  //     contract.connect(user).setBaseURI("https://new-base-uri.com")
  //   ).to.be.revertedWith(
  //     `AccessControl: account ${user.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
  //   );
  // });

  // it("Should change supply available with success", async () => {
  //   const tx = await contract.setSupplyAvailable(100);
  //   await tx.wait();

  //   await expect(tx)
  //     .to.emit(contract, "SupplyAvailableChanged")
  //     .withArgs(1000, 100);
  //   expect(await contract.supplyAvailable()).to.eq(100);
  // });

  // it("Should not be able to change supply available if caller hasn't DEFAULT_ADMIN_ROLE", async () => {
  //   await expect(
  //     contract.connect(user).setSupplyAvailable(100)
  //   ).to.be.revertedWith(
  //     `AccessControl: account ${user.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
  //   );
  // });

  // it("Should change mint amount with success", async () => {
  //   const tx = await contract.setMintAmount(3);
  //   await tx.wait();

  //   await expect(tx).to.emit(contract, "MintAmountChanged").withArgs(2, 3);
  // });

  // it("Should not be able to change mint amount if caller hasn't DEFAULT_ADMIN_ROLE", async () => {
  //   await expect(contract.connect(user).setMintAmount(3)).to.be.revertedWith(
  //     `AccessControl: account ${user.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
  //   );
  // });

  // it("Should return workshop details from owner", async () => {
  //   await mint(user);

  //   const artist = await contract.getTokenDetailsByOwner(user.address);
  //   expect(artist.length).to.eq(1);
  //   expect(artist[0].creativity).to.eq(1);
  //   expect(artist[0].colorSlots).to.eq(2);
  // });

  // it("Should return token URI with success", async () => {
  //   await mint(user);

  //   const uri = await contract.tokenURI(0);
  //   expect(uri).to.eq(`${baseURI}0`);
  // });

  // it("Should change drop rate with success", async () => {
  //   const tx = await contract.setDropRate([400, 400, 100, 70, 30]);
  //   await tx.wait();

  //   const dropRate = await contract.getDropRate();
  //   await expect(tx)
  //     .to.emit(contract, "DropRateChanged")
  //     .withArgs([41, 26, 20, 9, 4], [400, 400, 100, 70, 30]);
  //   expect(dropRate.length).to.be.eq(5);
  // });

  // it("Should return drop rate", async () => {
  //   const dropRate = await contract.getDropRate();
  //   await expect(dropRate.length).to.be.eq(5);
  // });

  // it("Should revert mint if max amount by user already reached", async () => {
  //   await mint(user);
  //   await mint(user);
  //   await expect(
  //     contract.connect(user).mint({ value: MINT_PRICE_ARTIST })
  //   ).to.be.revertedWith("User limit reached");
  // });
});
