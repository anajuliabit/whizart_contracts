import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { expect, use } from "chai";
import { solidity } from "ethereum-waffle";
import { ethers, getChainId, upgrades } from "hardhat";
import {
  DEFAULT_ADMIN_ROLE,
  MAINTENANCE_ROLE,
  MINT_PRICE,
  STAFF_ROLE,
} from "test/utils/constants";
import { Rarity } from "test/utils/enums/rarity.enum";
import { WhizartArtist } from "types/contracts";
import { networkConfig } from "utils/network";

use(solidity);

const baseURI = "ipfs://";

describe("WhizartArtist", function () {
  let contract: WhizartArtist;
  let deployer: SignerWithAddress,
    user: SignerWithAddress,
    user2: SignerWithAddress,
    treasury: SignerWithAddress;
  this.beforeEach(async () => {
    [deployer, user, user2, treasury] = await ethers.getSigners();
    const chainId = await getChainId();
    const { vrfCoordinator, linkToken, keyHash } = networkConfig[chainId];

    const contractFactory = await ethers.getContractFactory("WhizartArtist");

    contract = (await upgrades.deployProxy(
      contractFactory,
      [vrfCoordinator, linkToken, keyHash],
      { kind: "uups" }
    )) as WhizartArtist;

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
    expect(await contract.baseURI()).to.eq(baseURI);
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

  it("Should sweepEthToAddress with success", async () => {
    const value = ethers.utils.parseUnits("1");
    const tx = await user.sendTransaction({
      to: contract.address,
      value,
    });
    await tx.wait();

    const balanceBefore = await ethers.provider.getBalance(contract.address);

    const refund = await contract.sweepEthToAddress(user.address, value);
    await refund.wait();

    const balanceAfter = await ethers.provider.getBalance(contract.address);
    expect(balanceBefore.sub(balanceAfter)).to.be.eq(value);
  });

  it("Should revert if sweepEthToAddress caller has not DEFAULT_ADMIN_ROLE", async () => {
    const value = ethers.utils.parseUnits("1");
    const tx = await user.sendTransaction({
      to: contract.address,
      value,
    });
    await tx.wait();

    await expect(
      contract.connect(user2).sweepEthToAddress(user.address, value)
    ).to.be.revertedWith(
      `AccessControl: account ${user2.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
    );
  });

  it("Should withdraw with success", async () => {
    const value = ethers.utils.parseUnits("1");
    const tx = await user.sendTransaction({
      to: contract.address,
      value,
    });
    await tx.wait();
    const balanceBefore = await ethers.provider.getBalance(treasury.address);

    const withdraw = await contract.withdraw(treasury.address, value);
    await withdraw.wait();

    const balanceAfter = await ethers.provider.getBalance(treasury.address);
    await expect(withdraw)
      .to.emit(contract, "Withdraw")
      .withArgs(treasury.address, value);
    expect(await ethers.provider.getBalance(contract.address)).to.eq(0);
    expect(balanceAfter.sub(balanceBefore)).to.at.least(value);
  });

  it("Should revert if withdraw caller has not DEFAULT_ADMIN_ROLE", async () => {
    await expect(
      contract.connect(user2).withdraw(treasury.address, MINT_PRICE)
    ).to.be.revertedWith(
      `AccessControl: account ${user2.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
    );
  });

  it("Should revert if contract hasn't withdraw amount", async () => {
    await expect(
      contract.connect(deployer).withdraw(treasury.address, MINT_PRICE)
    ).to.be.revertedWith("Invalid amount");
  });

  it("Should change baseURI with success", async () => {
    const newBaseURI = "https://new-base-uri.com";
    const tx = await contract.changeBaseURI(newBaseURI);
    await tx.wait();

    await expect(tx)
      .to.emit(contract, "BaseURIChanged")
      .withArgs(baseURI, newBaseURI);
  });

  it("Should not be able to change baseURI if caller hasn't DEFAULT_ADMIN_ROLE", async () => {
    await expect(
      contract.connect(user).changeBaseURI("https://new-base-uri.com")
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
    );
  });

  it("Should change supply available with success", async () => {
    const tx = await contract.changeSupplyAvailable(100);
    await tx.wait();

    await expect(tx)
      .to.emit(contract, "SupplyAvailableChanged")
      .withArgs(4000, 100);
    expect(await contract.supplyAvailable()).to.eq(100);
  });

  it("Should not be able to change supply available if caller hasn't DEFAULT_ADMIN_ROLE", async () => {
    await expect(
      contract.connect(user).changeSupplyAvailable(100)
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
    );
  });

  it("Should change mint amount with success", async () => {
    const tx = await contract.changeMintAmount(3);
    await tx.wait();

    await expect(tx).to.emit(contract, "MintAmountChanged").withArgs(2, 3);
  });

  it("Should not be able to change mint amount if caller hasn't DEFAULT_ADMIN_ROLE", async () => {
    await expect(contract.connect(user).changeMintAmount(3)).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
    );
  });

  it("Should set mint price with success", async () => {
    const newPrice = ethers.utils.parseUnits("1");
    const tx = await contract.setMintPrice(newPrice);
    await tx.wait();

    await expect(tx)
      .to.emit(contract, "PriceChanged")
      .withArgs(MINT_PRICE, newPrice);
    expect(await contract.mintPrice()).to.eq(newPrice);
  });

  it("Should not be able to change mint price if caller hasn't DEFAULT_ADMIN_ROLE", async () => {
    await expect(
      contract.connect(user).setMintPrice(MINT_PRICE)
    ).to.be.revertedWith(
      `AccessControl: account ${user.address.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`
    );
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
});
