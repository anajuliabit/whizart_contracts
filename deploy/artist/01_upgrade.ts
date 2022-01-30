import { ethers, network, run, tenderly, upgrades } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { WArtist__factory } from "types/contracts";

const contractName = "WArtist";

const func: DeployFunction = async ({
  deployments,
}: HardhatRuntimeEnvironment) => {
  const { save } = deployments;

  const contractFactory: WArtist__factory = await ethers.getContractFactory(
    contractName
  );

  const proxy = await upgrades.upgradeProxy(
    "0xd02Ae92c07ED004a0564F3c4dEFB7cA63475B4Fa",
    contractFactory
  );

  await proxy.deployed();

  console.log(proxy.address);

  const artifact = await deployments.getExtendedArtifact("WArtist");
  const proxyDeployments = {
    address: proxy.address,
    ...artifact,
  };

  await save("WArtist", proxyDeployments);

  await run("verify:verify", {
    address: proxy.address,
  });

  await tenderly.verify({
    name: contractName,
    address: proxy.address,
    network: network.name,
  });
};
export default func;
func.tags = ["WArtist:upgrade"];
