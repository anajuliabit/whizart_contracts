import { ethers } from "hardhat";
 
const deployContract = async () => {
  const [owner] = await ethers.getSigners();

  const WArtist = await ethers.getContractFactory("contracts/WhizArt.sol:WhizArt");
  const contract = await WArtist.deploy(owner.address);

  console.log(contract.address);
  
};

deployContract()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
  
/*
Tenderly verification
let verification = await tenderly.verify({
  name: contractName,
  address: contractAddress,
  network: targetNetwork,
});
*/
