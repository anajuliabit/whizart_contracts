import { ethers, getChainId, upgrades } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { WArtist__factory } from "types/contracts";
import { networkConfig } from "utils/network";

const func: DeployFunction = async ({
  getNamedAccounts,
  deployments,
}: HardhatRuntimeEnvironment) => {
  const { save } = deployments;
  const { treasury } = await getNamedAccounts();

  const contractFactory: WArtist__factory = await ethers.getContractFactory(
    "contracts/WArtist.sol:WArtist"
  );
  const chainId = await getChainId();

  const { stableCoinAddress, linkToken, vrfCoordinator, keyHash } =
    networkConfig[chainId];

  const proxy = await upgrades.deployProxy(
    contractFactory,
    [treasury, vrfCoordinator, linkToken, keyHash, stableCoinAddress],
    {
      kind: "uups",
    }
  );

  await proxy.deployed();

  console.log(proxy.address);
  const artifact = await deployments.getExtendedArtifact("WArtist");
  const proxyDeployments = {
    address: proxy.address,
    ...artifact,
  };

  await save("WArtist", proxyDeployments);
};
export default func;
func.tags = ["WArtist"];

/*
Tenderly verification
let verification = await tenderly.verify({
  name: contractName,
  address: contractAddress,
  network: targetNetwork,
});
*/
