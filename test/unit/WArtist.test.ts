import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { expect, use } from "chai";
import { solidity } from "ethereum-waffle";
import { ethers, getChainId, upgrades } from "hardhat";
import { WArtist } from "types/contracts";
import { networkConfig } from "utils/network";

// Run the tests with a copy of rinkeby network
// npx ganache-cli -f https://rinkeby.infura.io/v3/${INFURA_KEY} -p 8545 --unlock 0xf50aced0016256bc3aee3b4dca2170c9c8cd3abb

use(solidity);

describe("WArtist", function () {
  let contract: WArtist;
  let owner: SignerWithAddress,user: SignerWithAddress
  this.beforeAll(async () => {
    [owner, user] = await ethers.getSigners();
    const chainId = await getChainId();
    const { vrfCoordinator, linkToken, keyHash } = networkConfig[chainId];

    const contractFactory = await ethers.getContractFactory(
      "contracts/WArtist.sol:WArtist"
    );

    contract = (await upgrades.deployProxy(
      contractFactory,
      [owner.address, vrfCoordinator, linkToken, keyHash],
      { kind: "uups" }
    )) as WArtist;

    await contract.deployed();
    console.log("wArtist", contract.address);
  });

  it("Should add address to whitelist", async function () {
    await contract.addWhitelist(user.address);
    expect(await contract.whitelist(user.address)).eq(true);
  });
});
