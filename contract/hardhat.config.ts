import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";


require('dotenv').config();

const configuredAccounts = process.env.WALLET_KEY ? [process.env.WALLET_KEY] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.27',
  },
  networks: {
    // for mainnet
    'base-mainnet': {
      url: 'https://mainnet.base.org',
      accounts: configuredAccounts,
      gasPrice: 1000000000,
    },
    // for testnet
    'base-sepolia': {
      url: 'https://sepolia.base.org',
      accounts: configuredAccounts,
      gasPrice: 1000000000,
    },
    baseSepolia: {
      url: 'https://sepolia.base.org',
      accounts: configuredAccounts,
      gasPrice: 1000000000,
    },
    // for local dev environment
    'base-local': {
      url: 'http://localhost:8545',
      accounts: configuredAccounts,
      gasPrice: 1000000000,
    },
  },
  defaultNetwork: 'hardhat',
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY as string,
  },
  sourcify: {
    enabled: true
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

export default config;
