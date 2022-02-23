import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { expect, use } from "chai";
import { solidity } from "ethereum-waffle";
import { ContractTransaction } from "ethers";
import { ethers, upgrades } from "hardhat";
import { MINT_PRICE } from "test/utils/constants";
import { WhizartBox, WhizartWorkshop } from "types/contracts";

use(solidity);

describe("WhizartBox", function () {
  let contract: WhizartBox;
  let workshopContract: WhizartWorkshop;
  let deployer: SignerWithAddress,
    user: SignerWithAddress,
    user2: SignerWithAddress,
    treasury: SignerWithAddress;
  this.beforeEach(async () => {
    [deployer, user, user2, treasury] = await ethers.getSigners();

    const workshopFactory = await ethers.getContractFactory("WhizartWorkshop");
    workshopContract = (await upgrades.deployProxy(workshopFactory, {
      kind: "uups",
    })) as WhizartWorkshop;
    await workshopContract.deployed();

    const contractFactory = await ethers.getContractFactory("WhizartBox");
    contract = (await contractFactory.deploy(
      workshopContract.address
    )) as WhizartBox;
    await contract.deployed();

    await workshopContract.setBoxyContract(contract.address);
  });

  async function mint(
    to: SignerWithAddress,
    spaceBetweenBlocks = 2
  ): Promise<{
    mintTransaction: ContractTransaction;
    processTransaction: ContractTransaction;
  }> {
    await workshopContract.connect(deployer).addWhitelist(to.address);
    const tx = await contract.connect(to).mint({
      value: MINT_PRICE,
    });
    await tx.wait();

    for (let index = 0; index < spaceBetweenBlocks; index++) {
      await ethers.provider.send("evm_mine", []);
    }

    const processRequest = await workshopContract
      .connect(user)
      .processMintRequest();
    await processRequest.wait();
    return { mintTransaction: tx, processTransaction: processRequest };
  }

  it("Should mint with success", async () => {
    const balanceBefore = await ethers.provider.getBalance(
      workshopContract.address
    );
    const balanceBeforeUser = await ethers.provider.getBalance(user.address);

    const blockNumber = await ethers.provider.getBlockNumber();

    const { mintTransaction, processTransaction } = await mint(user);

    const balanceAfter = await ethers.provider.getBalance(
      workshopContract.address
    );
    const balanceAfterUser = await ethers.provider.getBalance(user.address);

    await expect(mintTransaction)
      .to.emit(workshopContract, "MintRequested")
      .withArgs(user.address, blockNumber + 3);
    await expect(processTransaction)
      .to.emit(workshopContract, "TokenMinted")
      .withArgs(user.address, 0);
    expect(await workshopContract.balanceOf(user.address)).to.eq(1);
    expect(await workshopContract.totalSupply()).to.eq(1);
    expect(await workshopContract.supplyAvailable()).to.eq(9);
    expect(balanceAfter.sub(balanceBefore)).to.be.at.least(MINT_PRICE);
    expect(balanceBeforeUser.sub(balanceAfterUser)).to.be.at.least(MINT_PRICE);
  });
});
