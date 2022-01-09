import { ethers, upgrades } from 'hardhat';

const deployContract = async() => {
  
  const WArtist = await ethers.getContractFactory("contracts/WArtist.sol:WArtist");
  const contract = await upgrades.deployProxy(WArtist, [
    // treasury address
    "0x191FE20e73226EF6392E9b8332eFE7F7C457e82D", 
    // VRF rinkenby address
    "0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B", 
    // LINK rinkenby address
    "0x01BE23585060835E02B77ef475b0Cc51aA1e0709",
], { kind: 'uups' });

  await contract.deployed();
  console.log('wArtist', contract.address);

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
