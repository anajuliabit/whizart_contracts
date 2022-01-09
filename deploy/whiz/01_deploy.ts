import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironmentExtended } from 'types/hardhat-type-extensions';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironmentExtended) => {
  const { getNamedAccounts, deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  
  await deploy('WhizArt', {
    from: deployer,
    args: [deployer],
    log: true,
  });

};
export default func;
func.tags = ['WhizArt'];

/*
Tenderly verification
let verification = await tenderly.verify({
  name: contractName,
  address: contractAddress,
  network: targetNetwork,
});
*/
