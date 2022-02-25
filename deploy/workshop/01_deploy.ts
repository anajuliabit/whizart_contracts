import { ContractFactory } from "ethers";
import { ethers, upgrades } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { WhizartWorkshop__factory } from "types/contracts";

const contractName = "WhizartWorkshop";

const func: DeployFunction = async ({
  deployments,
}: HardhatRuntimeEnvironment) => {
  const { save } = deployments;

  const contractFactory: WhizartWorkshop__factory =
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

  const artifact = await deployments.getExtendedArtifact(contractName);
  const proxyDeployments = {
    address: proxy.address,
    ...artifact,
  };

  await save("Workshop", proxyDeployments);
};
export default func;
func.tags = ["Workshop:deploy"];
