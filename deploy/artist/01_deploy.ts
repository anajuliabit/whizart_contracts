import { ethers, getChainId, upgrades } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { WArtist__factory } from "types/contracts";
import { networkConfig } from "utils/network";

const contractName = "WArtist";

const func: DeployFunction = async ({
  deployments,
}: HardhatRuntimeEnvironment) => {
  const { save } = deployments;

  const contractFactory: WArtist__factory = await ethers.getContractFactory(
    contractName
  );
  const chainId = await getChainId();

  const { linkToken, vrfCoordinator, keyHash } = networkConfig[chainId];

  const proxy = await upgrades.deployProxy(
    contractFactory,
    [vrfCoordinator, linkToken, keyHash],
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
func.tags = ["WArtist:deploy"];
