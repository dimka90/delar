import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("DelarContract - Buy Land", function () {
  async function deployAndSetup() {
    const [owner, seller, buyer] = await hre.ethers.getSigners();

    const DelarToken = await hre.ethers.deployContract("DelarToken");
    const DelarNFT = await hre.ethers.deployContract("DelarNFT");
    const DelarContract = await hre.ethers.deployContract("DelarContract", [
      await DelarToken.getAddress(),
      await DelarNFT.getAddress(),
    ]);

    await DelarNFT.connect(owner).transferOwnership(await DelarContract.getAddress());

    const assessedValuePerPlot = hre.ethers.parseEther("10");
    const listingPricePerPlot = hre.ethers.parseEther("12");

    await DelarToken.connect(owner).transfer(buyer.address, listingPricePerPlot * 10n);
    await DelarToken.connect(buyer).approve(await DelarContract.getAddress(), listingPricePerPlot * 10n);

    await DelarNFT.connect(seller).setApprovalForAll(await DelarContract.getAddress(), true);

    await DelarContract.connect(seller).registerLand(
      4,
      "Lagos",
      "Ikeja",
      "Victoria Island",
      assessedValuePerPlot,
      12345,
      "QmImage",
      "QmCofo"
    );

    await DelarContract.connect(owner).verifyLand(seller.address, 0);
    await DelarContract.connect(seller).listLand(0, listingPricePerPlot);

    return {
      DelarContract,
      DelarToken,
      DelarNFT,
      owner,
      seller,
      buyer,
      assessedValuePerPlot,
      listingPricePerPlot,
    };
  }

  describe("Successful Purchase", function () {
    it("Should complete land purchase with a valid listing", async function () {
      const { DelarContract, DelarToken, DelarNFT, seller, buyer, assessedValuePerPlot, listingPricePerPlot } =
        await loadFixture(deployAndSetup);

      const totalPrice = listingPricePerPlot * 4n;
      const initialListingCount = (await DelarContract.viewAllListings()).length;

      await expect(DelarContract.connect(buyer).buyLand(1))
        .to.emit(DelarContract, "LandSold")
        .withArgs(seller.address, buyer.address, totalPrice);

      expect(await DelarToken.balanceOf(seller.address)).to.equal(totalPrice);
      expect(await DelarToken.balanceOf(buyer.address)).to.equal(listingPricePerPlot * 10n - totalPrice);

      expect(await DelarNFT.balanceOf(buyer.address, 1)).to.equal(1);
      expect(await DelarNFT.balanceOf(seller.address, 1)).to.equal(0);

      const buyerLand = await DelarContract.lands(buyer.address, 0);
      expect(buyerLand.numberOfPlots).to.equal(4);
      expect(buyerLand.isVerified).to.be.true;
      expect(buyerLand.isListed).to.be.false;
      expect(buyerLand.assessedValuePerPlot).to.equal(assessedValuePerPlot);

      const sellerLand = await DelarContract.lands(seller.address, 0);
      expect(sellerLand.numberOfPlots).to.equal(0);

      const finalListings = await DelarContract.viewAllListings();
      expect(finalListings.length).to.equal(initialListingCount - 1);

      const history = await DelarContract.landHistoricalData(12345, 1);
      expect(history.soldFrom).to.equal(seller.address);
      expect(history.soldTo).to.equal(buyer.address);
      expect(history.amount).to.equal(totalPrice);

      const registeredLands = await DelarContract.viewAllRegisteredLands();
      expect(registeredLands.length).to.equal(1);
      expect(registeredLands[0].owner).to.equal(buyer.address);
      expect(registeredLands[0].landIndex).to.equal(0);
      expect(registeredLands[0].titleNumber).to.equal(12345);
    });
  });

  describe("Purchase Failures", function () {
    it("Should revert if listing does not exist", async function () {
      const { DelarContract, buyer } = await loadFixture(deployAndSetup);

      await expect(DelarContract.connect(buyer).buyLand(99)).to.be.revertedWithCustomError(
        DelarContract,
        "ListingDoesNotExist"
      );
    });

    it("Should revert with insufficient balance", async function () {
      const { DelarContract, DelarToken, buyer, seller, owner } = await loadFixture(deployAndSetup);

      await DelarContract.connect(seller).registerLand(
        4,
        "Lagos",
        "Ikeja",
        "Victoria Island",
        hre.ethers.parseEther("10"),
        123499,
        "QmImage",
        "QmCofo"
      );

      await DelarContract.connect(owner).verifyLand(seller.address, 1);
      await DelarContract.connect(seller).listLand(1, hre.ethers.parseEther("50"));

      await expect(DelarContract.connect(buyer).buyLand(2)).to.be.revertedWithCustomError(
        DelarContract,
        "InsufficientDelarTokens"
      );
    });

    it("Should revert with insufficient allowance", async function () {
      const { DelarContract, DelarToken, buyer } = await loadFixture(deployAndSetup);

      await DelarToken.connect(buyer).approve(await DelarContract.getAddress(), 0);

      await expect(DelarContract.connect(buyer).buyLand(1)).to.be.revertedWithCustomError(
        DelarContract,
        "InsufficientAllowanceToTransferDelarTokens"
      );
    });
  });
});
