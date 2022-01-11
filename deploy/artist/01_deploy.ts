import { ethers, getChainId, upgrades } from "hardhat";
import { WArtist__factory } from "types/contracts";
import { networkConfig } from "utils/helper";

const deployContract = async () => {
  const contractFactory: WArtist__factory = await ethers.getContractFactory(
    "contracts/WArtist.sol:WArtist"
  );

  const chainId = await getChainId();

  const { stableCoinAddress, linkToken, vrfCoordinator, keyHash } =
    networkConfig[chainId];
  const [owner] = await ethers.getSigners();

  const contract = await upgrades.deployProxy(
    contractFactory,
    [owner.address, vrfCoordinator, linkToken, keyHash, stableCoinAddress],
    {
      kind: "uups",
    }
  );

  await contract.deployed();
  console.log("wArtist", contract.address);
};

deployContract()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

/*
Tenderly verification
let verification = await tenderly.verify({
  name: contractName,
  address: contractAddress,
  network: targetNetwork,
});
*/
