import { ethers } from "hardhat";

async function main() {
    console.log("Starting deployment on Base Sepolia...");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // 1. Deploy DelarToken
    console.log("Deploying DelarToken...");
    const DelarToken = await ethers.getContractFactory("DelarToken");
    const token = await DelarToken.deploy();
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("DelarToken deployed to:", tokenAddress);

    // 2. Deploy DelarNFT
    console.log("Deploying DelarNFT...");
    const DelarNFT = await ethers.getContractFactory("DelarNFT");
    const nft = await DelarNFT.deploy();
    await nft.waitForDeployment();
    const nftAddress = await nft.getAddress();
    console.log("DelarNFT deployed to:", nftAddress);

    // 3. Deploy DelarContract
    console.log("Deploying DelarContract...");
    const DelarContract = await ethers.getContractFactory("DelarContract");
    const contract = await DelarContract.deploy(tokenAddress, nftAddress);
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    console.log("DelarContract deployed to:", contractAddress);

    // 4. Transfer ownership of DelarNFT to DelarContract
    console.log("Transferring DelarNFT ownership to DelarContract...");
    const transferTx = await nft.transferOwnership(contractAddress);
    await transferTx.wait();
    console.log("Ownership transferred successfully.");

    console.log("\n--- Deployment Summary ---");
    console.log("VITE_CONTRACT_ADDRESS=" + contractAddress);
    console.log("VITE_NFT_CONTRACT_ADDRESS=" + nftAddress);
    console.log("VITE_TOKEN_ADDRESS=" + tokenAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
