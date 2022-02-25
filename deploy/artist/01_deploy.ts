import { ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { WhizartArtist__factory } from "types/contracts";

const contractName = "WhizartArtist";

const func: DeployFunction = async ({
  deployments,
}: HardhatRuntimeEnvironment) => {
  const { save } = deployments;

  const contractFactory: WhizartArtist__factory =
    await ethers.getContractFactory(contractName);

  const proxy = await upgrades.deployProxy(
    contractFactory as ContractFactory,
    [],
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
