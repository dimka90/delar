import { ethers } from 'hardhat';

async function main() {
  const DelarNFT = await ethers.deployContract('DelarNFT');

  await DelarNFT.waitForDeployment();

  console.log('DelarNFT Contract Deployed at ' + await DelarNFT.getAddress());

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});