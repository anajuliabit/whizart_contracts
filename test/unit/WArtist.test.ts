import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { expect, use } from "chai";
import { solidity } from "ethereum-waffle";
import { ethers, getChainId, upgrades } from "hardhat";
import { ERC20, WArtist } from "types/contracts";
import { networkConfig } from "utils/helper";

// Run the tests with a copy of rinkeby network
// npx ganache-cli -f https://rinkeby.infura.io/v3/${INFURA_KEY} -p 8545 --unlock 0xf50aced0016256bc3aee3b4dca2170c9c8cd3abb

use(solidity);

describe("WArtist", function () {
  let contract: WArtist;
  let stableCoin: ERC20;
  let owner: SignerWithAddress,
    user: SignerWithAddress,
    whale: SignerWithAddress;
  this.beforeAll(async () => {
    [owner, user] = await ethers.getSigners();
    const chainId = await getChainId();
    const {
      whaleStableCoinAddress,
      stableCoinAddress,
      vrfCoordinator,
      linkToken,
      keyHash,
    } = networkConfig[chainId];
    if (!whaleStableCoinAddress || !stableCoinAddress) {
      throw new Error("Missing address for this network");
    }
    whale = await ethers.getSigner(whaleStableCoinAddress);
    stableCoin = await ethers.getContractAt("ERC20", stableCoinAddress);
    const contractFactory = await ethers.getContractFactory(
      "contracts/WArtist.sol:WArtist"
    );
    await stableCoin.connect(whale).transfer(user.address, "1000000000");

    contract = (await upgrades.deployProxy(
      contractFactory,
      [owner.address, vrfCoordinator, linkToken, keyHash, stableCoinAddress],
      { kind: "uups" }
    )) as WArtist;

    await contract.deployed();
    console.log("wArtist", contract.address);
  });

  it("Should add address to whitelist", async function () {
    await contract.addToWhitelist([user.address]);
    expect(await contract.whitelist(user.address)).eq(true);
  });

  it.skip("Should mint Artist", async () => {
    await stableCoin.connect(user).approve(contract.address, "1000000000");
    const mint = await contract.connect(user).mintWhitelist("500000000");
    await mint.wait();
    console.log(Number(await stableCoin.balanceOf(user.address)));
    expect(await contract.balanceOf(user.address)).eq(1);
  });
});
