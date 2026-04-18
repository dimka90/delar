import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying DelarContract with the account:", deployer.address);
  
  // DelarNFT contract is already deployed at this address
  // const nftAddress = "0x0A0d4CD0dc9ab209D3c46861d7F4D179Ede1738C";
  // console.log("Using NFT contract at:", nftAddress);

  const DelarNFTFactory = await ethers.getContractFactory("DelarNFT");
  const DelarNFT = await DelarNFTFactory.deploy();
  await DelarNFT.waitForDeployment();
  const nftAddress = await DelarNFT.getAddress();
  console.log("DelarNFT Contract Deployed at:", nftAddress);
  
  // Deploy DelarToken first
  const DelarTokenFactory = await ethers.getContractFactory("DelarToken");
  const delarToken = await DelarTokenFactory.deploy();
  await delarToken.waitForDeployment();
  const tokenAddress = await delarToken.getAddress();
  console.log("DelarERC20Token Contract Deployed at:", tokenAddress);
  
  // Deploy DelarContract with the token and NFT addresses
  const DelarContractFactory = await ethers.getContractFactory("contracts/DelarContract.sol:DelarContract");
  const delarContract = await DelarContractFactory.deploy(tokenAddress, nftAddress);
  await delarContract.waitForDeployment();
  const contractAddress = await delarContract.getAddress();
  console.log("DelarContract Contract Deployed at:", contractAddress);

  await DelarNFT.setURI("https://violet-solid-gazelle-313.mypinata.cloud/ipfs/bafybeibl3hdafpvuvxokarm7xbp2qwqcjatkjf6cllhziyrrpbkb72jf3i/1");

  console.log("NFT URI successfully set ...");

  await DelarNFT.transferOwnership(contractAddress);

  console.log("NFT ownership successfully transferred to DelarContract ...");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});