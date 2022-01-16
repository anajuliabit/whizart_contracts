import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { expect } from "chai";
import { ethers, getChainId, getNamedAccounts, network } from "hardhat";
import { Proxy } from "types/proxy";
import { ERC20, WArtist } from "../../types/contracts";
import { networkConfig } from "../../utils/network";

// Run this test only in development network
// It's necessary that the deployed contract has LINK (faucet)
// It's necessary that the beneficiary address has stable coin tokens

describe("WArtist Integration Tests", function () {
  let contract: WArtist;
  let stableCoin: ERC20;
  let owner: SignerWithAddress, user: SignerWithAddress;
  let decimals: number;
  this.beforeAll(async () => {
    if (network.name !== "rinkeby") {
      throw new Error("Run this test only in development network");
    }

    const chainId = await getChainId();
    const { stableCoinAddress } = networkConfig[chainId];
    if (!stableCoinAddress) {
      throw new Error("Missing address for this network");
    }

    const { beneficiary, deployer } = await getNamedAccounts();
    owner = await ethers.getSigner(deployer);
    user = await ethers.getSigner(beneficiary);

    const WArtistContract: WArtist = await ethers.getContractAt(
      "WArtist",
      "0x559248F8fCCa69043CFf80dF2478E5BF163Ac770"
    );

    // delegates call to proxy contract
    const proxy = (await import(
      `../../.openzeppelin/${network.name}.json`
    )) as Proxy;
    contract = WArtistContract.attach(
      proxy.proxies[proxy.proxies.length - 1].address
    );

    stableCoin = await ethers.getContractAt("ERC20", stableCoinAddress, user);
    decimals = await stableCoin.decimals();
    console.log(contract.address);
  });

  it("Shoud add to whitelist", async () => {
    const addToWhitelist = await contract
      .connect(owner)
      .addToWhitelist([user.address]);
    await addToWhitelist.wait();

    const isWhitelisted = await contract.whitelist(user.address);

    expect(isWhitelisted).eq(true);
  });

  it("Should approve WArtist to spender user tokens", async () => {
    const approve = await stableCoin
      .connect(user)
      .approve(contract.address, ethers.utils.parseUnits("10000000", decimals));
    await approve.wait();

    expect(
      Number(await stableCoin.allowance(user.address, contract.address))
    ).least(Number(ethers.utils.parseUnits("10000000", decimals)));
  });

  it("Should successfully mint a Artist", async () => {
    this.timeout(15000);
    const transaction = await contract
      .connect(user)
      .mintWhitelist(ethers.utils.parseUnits("500", decimals));
    const txReceipt = await transaction.wait();
    const events = txReceipt.events;
    console.log(events);

    // wait 60 secs for oracle to callback
    await new Promise((resolve) => setTimeout(resolve, 60000));
    expect(await contract.balanceOf(user.address)).eq(1);
  });
});
