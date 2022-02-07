import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async () => {
  const [owner] = await ethers.getSigners();

  const WArtist = await ethers.getContractFactory(
    "contracts/WhizartToken.sol:WhizartToken"
  );
  const contract = await WArtist.deploy(owner.address);

  console.log(contract.address);
};
export default func;
func.tags = ["WHIZ"];

/*
Tenderly verification
let verification = await tenderly.verify({
  name: contractName,
  address: contractAddress,
  network: targetNetwork,
});
*/
