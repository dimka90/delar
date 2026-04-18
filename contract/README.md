# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```22

Deploying DelarContract with the account: 0xA8Ab395F86b856C55f2119da0956699ED6f2EbDb
DelarNFT Contract Deployed at: 0xe5F5d93f8FAd8E70B6271fd79cC602229d6A981D
DelarERC20Token Contract Deployed at: 0x432D098fdEEd886C29D0694C06b9e47b180F2416
DelarContract Contract Deployed at: 0xE39cB772626418d38c778ad81097f151F2f7afAB



  // Deploy the contract
  const DelarContract = await DelarContractFactory.deploy(
    "0x49aC2AD1785d9577aF52a4Cd1511DcCC3AC42704",
    "0x134Ae99f229340fAcbe6F68cd21235BAD97670CF"
  );