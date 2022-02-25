import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { expect, use } from "chai";
import { solidity } from "ethereum-waffle";
import { ContractTransaction } from "ethers";
import { ethers, upgrades } from "hardhat";
import { MINT_PRICE_ARTIST, MINT_PRICE_WORKSHOP } from "test/utils/constants";
import { WhizartArtist, WhizartBox, WhizartWorkshop } from "types/contracts";

const MINT_PRICE = MINT_PRICE_ARTIST.add(MINT_PRICE_WORKSHOP);
use(solidity);

describe("WhizartBox", function () {
  let contract: WhizartBox;
  let workshopContract: WhizartWorkshop;
  let artistContract: WhizartArtist;
  let deployer: SignerWithAddress, user: SignerWithAddress;

  this.beforeEach(async () => {
    [deployer, user] = await ethers.getSigners();

    const workshopFactory = await ethers.getContractFactory("WhizartWorkshop");
    workshopContract = (await upgrades.deployProxy(workshopFactory, {
      kind: "uups",
    })) as WhizartWorkshop;
    await workshopContract.deployed();

    const artistFactory = await ethers.getContractFactory("WhizartArtist");
    artistContract = (await upgrades.deployProxy(artistFactory, {
      kind: "uups",
    })) as WhizartArtist;
    await workshopContract.deployed();

    const contractFactory = await ethers.getContractFactory("WhizartBox");
    contract = (await contractFactory.deploy(
      workshopContract.address,
      artistContract.address
    )) as WhizartBox;
    await contract.deployed();

    await workshopContract.setBoxyContract(contract.address);
    await artistContract.setBoxyContract(contract.address);
  });

  async function mint(
    to: SignerWithAddress,
    spaceBetweenBlocks = 2
  ): Promise<{
    mintTransaction: ContractTransaction;
    processMintArtist: ContractTransaction;
    processMintWorkshop: ContractTransaction;
  }> {
    await workshopContract.connect(deployer).addWhitelist(to.address);
    await artistContract.connect(deployer).addWhitelist(to.address);
    const tx = await contract.connect(to).mint({
      value: MINT_PRICE,
    });
    await tx.wait();

    for (let index = 0; index < spaceBetweenBlocks; index++) {
      await ethers.provider.send("evm_mine", []);
    }

    const processMintWorkshop = await workshopContract
      .connect(user)
      .processMintRequest();
    await processMintWorkshop.wait();
    const processMintArtist = await artistContract
      .connect(user)
      .processMintRequest();
    await processMintArtist.wait();
    return { mintTransaction: tx, processMintArtist, processMintWorkshop };
  }

  it("Should mint with success", async () => {
    const balanceBefore = await ethers.provider.getBalance(
      workshopContract.address
    );
    const balanceBeforeArtist = await ethers.provider.getBalance(
      artistContract.address
    );
    const balanceBeforeUser = await ethers.provider.getBalance(user.address);

    const blockNumber = await ethers.provider.getBlockNumber();

    const { mintTransaction, processMintArtist, processMintWorkshop } =
      await mint(user);

    const balanceAfter = await ethers.provider.getBalance(
      workshopContract.address
    );
    const balanceAfterArtist = await ethers.provider.getBalance(
      artistContract.address
    );
    const balanceAfterUser = await ethers.provider.getBalance(user.address);

    await expect(mintTransaction)
      .to.emit(workshopContract, "MintRequested")
      .withArgs(user.address, blockNumber + 4);
    await expect(processMintWorkshop)
      .to.emit(workshopContract, "TokenMinted")
      .withArgs(user.address, 0);
    expect(await workshopContract.balanceOf(user.address)).to.eq(1);
    expect(await workshopContract.totalSupply()).to.eq(1);
    expect(await workshopContract.supplyAvailable()).to.eq(9);
    await expect(processMintArtist)
      .to.emit(artistContract, "TokenMinted")
      .withArgs(user.address, 0);
    expect(await artistContract.balanceOf(user.address)).to.eq(1);
    expect(await artistContract.totalSupply()).to.eq(1);
    expect(await artistContract.supplyAvailable()).to.eq(999);

    expect(balanceAfter.sub(balanceBefore)).to.be.at.least(MINT_PRICE_WORKSHOP);
    expect(balanceAfterArtist.sub(balanceBeforeArtist)).to.be.at.least(
      MINT_PRICE_ARTIST
    );
    expect(balanceBeforeUser.sub(balanceAfterUser)).to.be.at.least(MINT_PRICE);
  });

  // it("Should failed mint if send wrong amount of BNB", async () => {
  //   const { mintTransaction, processMintArtist, processMintWorkshop } =
  //     await mint(user);
  //   console.log(mintTransaction);
  //   await expect(mint(user)).to.be.revertedWith("wrong amount of BNB");
  // });
});
