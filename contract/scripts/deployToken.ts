import { ethers } from 'hardhat';

async function main() {
  const DelarToken = await ethers.deployContract('DelarToken');

  await DelarToken.waitForDeployment();

  console.log('DelarToken Contract Deployed at ' + DelarToken);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});