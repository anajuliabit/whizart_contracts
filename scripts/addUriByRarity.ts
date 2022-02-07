import { ethers, getNamedAccounts } from "hardhat";
import { WhizartArtist } from "types/contracts";
import { Proxy } from "types/proxy";

async function addUris() {
  const { deployer } = await getNamedAccounts();
  const owner = await ethers.getSigner(deployer);

  const proxy = (await import(`../.openzeppelin/unknown-80001.json`)) as Proxy;

  const implKeys = Object.keys(proxy.impls);
  const WArtistContract: WhizartArtist = await ethers.getContractAt(
    "WArtist",
    proxy.impls[implKeys[implKeys.length - 1]].address
  );

  // delegates call to proxy contract
  const contract = WArtistContract.attach(
    proxy.proxies[proxy.proxies.length - 1].address
  );

  await contract
    .connect(owner)
    .addAvailableURIs(0, [
      "bafkreide3yekzsbxgakge5j7qkgwvddhigjjoxao2so64neh7v624zp4jm",
      "bafkreie3aq3kllp347gb53izfl3nubs2rgw6qbtkqh3lsbpm7jc7f27uqq",
    ]);
  await contract
    .connect(owner)
    .addAvailableURIs(1, [
      "bafkreide3yekzsbxgakge5j7qkgwvddhigjjoxao2so64neh7v624zp4jm",
      "bafkreie3aq3kllp347gb53izfl3nubs2rgw6qbtkqh3lsbpm7jc7f27uqq",
    ]);
  await contract
    .connect(owner)
    .addAvailableURIs(2, [
      "bafkreide3yekzsbxgakge5j7qkgwvddhigjjoxao2so64neh7v624zp4jm",
      "bafkreie3aq3kllp347gb53izfl3nubs2rgw6qbtkqh3lsbpm7jc7f27uqq",
    ]);
  await contract
    .connect(owner)
    .addAvailableURIs(3, [
      "bafkreide3yekzsbxgakge5j7qkgwvddhigjjoxao2so64neh7v624zp4jm",
      "bafkreie3aq3kllp347gb53izfl3nubs2rgw6qbtkqh3lsbpm7jc7f27uqq",
    ]);
  await contract
    .connect(owner)
    .addAvailableURIs(4, [
      "bafkreide3yekzsbxgakge5j7qkgwvddhigjjoxao2so64neh7v624zp4jm",
      "bafkreie3aq3kllp347gb53izfl3nubs2rgw6qbtkqh3lsbpm7jc7f27uqq",
    ]);
}

addUris()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
