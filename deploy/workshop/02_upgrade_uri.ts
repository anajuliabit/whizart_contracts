import { ContractFactory } from "ethers";
import { ethers, network, tenderly, upgrades } from "hardhat";
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

  const proxy = await upgrades.upgradeProxy(
    "0x2FE2081Ce180C30df33b9697AD450fAc8E3c6D0e",
    contractFactory as ContractFactory
  );

  await proxy.deployed();

  console.log(proxy.address);

  const artifact = await deployments.getExtendedArtifact("WhizartWorkshop");
  const proxyDeployments = {
    address: proxy.address,
    ...artifact,
  };

  await save("Workshop", proxyDeployments);

  await tenderly.verify({
    name: contractName,
    address: proxy.address,
    network: network.name,
  });
};
export default func;
func.tags = ["Workshop:upgrade"];
