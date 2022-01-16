import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async () => {
  const [owner] = await ethers.getSigners();

  const WArtist = await ethers.getContractFactory(
    "contracts/WhizArt.sol:WhizArt"
  );
  const contract = await WArtist.deploy(owner.address);

  console.log(contract.address);
};
export default func;
func.tags = ["WhizArt"];

/*
Tenderly verification
let verification = await tenderly.verify({
  name: contractName,
  address: contractAddress,
  network: targetNetwork,
});
*/
