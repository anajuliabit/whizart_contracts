import { ContractFactory } from "ethers";
import { ethers, getChainId, upgrades } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { WhizartArtist__factory } from "types/contracts";
import { networkConfig } from "utils/network";

const contractName = "WhizartArtist";

const func: DeployFunction = async ({
  deployments,
}: HardhatRuntimeEnvironment) => {
  const { save } = deployments;

  const contractFactory: WhizartArtist__factory =
    await ethers.getContractFactory(contractName);
  const chainId = await getChainId();

  const { linkToken, vrfCoordinator, keyHash } = networkConfig[chainId];

  const proxy = await upgrades.deployProxy(
    contractFactory as ContractFactory,
    [vrfCoordinator, linkToken, keyHash],
    {
      kind: "uups",
    }
  );

  await proxy.deployed();

  console.log(proxy.address);

  const artifact = await deployments.getExtendedArtifact("WhizartArtist");
  const proxyDeployments = {
    address: proxy.address,
    ...artifact,
  };

  await save("WArtist", proxyDeployments);
};
export default func;
func.tags = ["WArtist:deploy"];
