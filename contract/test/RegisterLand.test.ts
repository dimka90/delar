import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("DelarContract - Register and Listing Lifecycle", function () {
  async function deployDelar() {
    const [owner, otherAccount, user1, user2] = await hre.ethers.getSigners();

    const DelarToken = await hre.ethers.deployContract("DelarToken");
    const DelarNftToken = await hre.ethers.deployContract("DelarNFT");
    const DelarContract = await hre.ethers.getContractFactory("DelarContract");
    const Delar = await DelarContract.deploy(
      await DelarToken.getAddress(),
      await DelarNftToken.getAddress()
    );

    await DelarNftToken.connect(owner).transferOwnership(await Delar.getAddress());

    return { Delar, owner, otherAccount, user1, user2, DelarToken, DelarNftToken };
  }

  const validLandParams = {
    plots: 5,
    state: "Lagos",
    lga: "Ikeja",
    city: "Alausa",
    assessedValuePerPlot: hre.ethers.parseEther("1"),
    listingPricePerPlot: hre.ethers.parseEther("1.25"),
    title: 12345,
    image: "QmImageHash",
    cofo: "QmCofoHash",
  };

  describe("Registration", function () {
    it("Should register land with valid parameters", async function () {
      const { Delar, user1, DelarNftToken } = await loadFixture(deployDelar);

      await expect(
        Delar.connect(user1).registerLand(
          validLandParams.plots,
          validLandParams.state,
          validLandParams.lga,
          validLandParams.city,
          validLandParams.assessedValuePerPlot,
          validLandParams.title,
          validLandParams.image,
          validLandParams.cofo
        )
      )
        .to.emit(Delar, "LandRegistered")
        .withArgs(
          user1.address,
          0,
          validLandParams.state,
          validLandParams.lga,
          validLandParams.city
        );

      const land = await Delar.lands(user1.address, 0);
      expect(land.numberOfPlots).to.equal(validLandParams.plots);
      expect(land.titleNumber).to.equal(validLandParams.title);
      expect(land.assessedValuePerPlot).to.equal(validLandParams.assessedValuePerPlot);
      expect(land.isVerified).to.be.false;
      expect(land.isListed).to.be.false;
      expect(land.activeListingId).to.equal(0);

      expect(await Delar.registeredTitles(validLandParams.title)).to.equal(true);
      expect(await DelarNftToken.balanceOf(user1.address, 1)).to.equal(1);
    });

    it("Should record land history by title number", async function () {
      const { Delar, user1 } = await loadFixture(deployDelar);

      await Delar.connect(user1).registerLand(
        validLandParams.plots,
        validLandParams.state,
        validLandParams.lga,
        validLandParams.city,
        validLandParams.assessedValuePerPlot,
        validLandParams.title,
        validLandParams.image,
        validLandParams.cofo
      );

      const history = await Delar.landHistoricalData(validLandParams.title, 0);
      expect(history.soldFrom).to.equal(hre.ethers.ZeroAddress);
      expect(history.soldTo).to.equal(user1.address);
      expect(history.numberofPlots).to.equal(validLandParams.plots);
      expect(history.amount).to.equal(0);
    });

    it("Should expose registered lands through the public registry explorer", async function () {
      const { Delar, user1 } = await loadFixture(deployDelar);

      await Delar.connect(user1).registerLand(
        validLandParams.plots,
        validLandParams.state,
        validLandParams.lga,
        validLandParams.city,
        validLandParams.assessedValuePerPlot,
        validLandParams.title,
        validLandParams.image,
        validLandParams.cofo
      );

      expect(await Delar.getRegisteredLandsCount()).to.equal(1);

      const registeredLands = await Delar.viewAllRegisteredLands();
      expect(registeredLands.length).to.equal(1);
      expect(registeredLands[0].owner).to.equal(user1.address);
      expect(registeredLands[0].landIndex).to.equal(0);
      expect(registeredLands[0].titleNumber).to.equal(validLandParams.title);

      const singleRef = await Delar.getRegisteredLandRef(0);
      expect(singleRef.owner).to.equal(user1.address);
      expect(singleRef.landIndex).to.equal(0);
      expect(singleRef.titleNumber).to.equal(validLandParams.title);
    });

    it("Should revert on invalid inputs", async function () {
      const { Delar, user1 } = await loadFixture(deployDelar);

      await expect(
        Delar.connect(user1).registerLand(
          0,
          validLandParams.state,
          validLandParams.lga,
          validLandParams.city,
          validLandParams.assessedValuePerPlot,
          validLandParams.title,
          validLandParams.image,
          validLandParams.cofo
        )
      ).to.be.revertedWithCustomError(Delar, "InvalidNumberOfPlots");

      await expect(
        Delar.connect(user1).registerLand(
          validLandParams.plots,
          validLandParams.state,
          validLandParams.lga,
          validLandParams.city,
          0,
          validLandParams.title,
          validLandParams.image,
          validLandParams.cofo
        )
      ).to.be.revertedWithCustomError(Delar, "InvalidPrice");

      await expect(
        Delar.connect(user1).registerLand(
          validLandParams.plots,
          "",
          validLandParams.lga,
          validLandParams.city,
          validLandParams.assessedValuePerPlot,
          validLandParams.title,
          validLandParams.image,
          validLandParams.cofo
        )
      ).to.be.revertedWithCustomError(Delar, "InvalidLandLocationDetails");
    });

    it("Should prevent duplicate title registration", async function () {
      const { Delar, user1, user2 } = await loadFixture(deployDelar);

      await Delar.connect(user1).registerLand(
        validLandParams.plots,
        validLandParams.state,
        validLandParams.lga,
        validLandParams.city,
        validLandParams.assessedValuePerPlot,
        validLandParams.title,
        validLandParams.image,
        validLandParams.cofo
      );

      await expect(
        Delar.connect(user2).registerLand(
          3,
          "Ogun",
          "Abeokuta",
          "Itoku",
          hre.ethers.parseEther("2"),
          validLandParams.title,
          "QmDifferentImage",
          "QmDifferentCofo"
        )
      ).to.be.revertedWithCustomError(Delar, "TitleExistAlready");
    });
  });

  describe("Verification and listing", function () {
    async function deployRegisteredLand() {
      const fixture = await deployDelar();
      const { Delar, user1 } = fixture;

      await Delar.connect(user1).registerLand(
        validLandParams.plots,
        validLandParams.state,
        validLandParams.lga,
        validLandParams.city,
        validLandParams.assessedValuePerPlot,
        validLandParams.title,
        validLandParams.image,
        validLandParams.cofo
      );

      return fixture;
    }

    it("Should allow only contract owner to verify land", async function () {
      const { Delar, owner, otherAccount, user1 } = await loadFixture(deployRegisteredLand);

      await expect(Delar.connect(otherAccount).verifyLand(user1.address, 0)).to.be.revertedWithCustomError(
        Delar,
        "NotContractOwner"
      );

      await expect(Delar.connect(owner).verifyLand(user1.address, 0))
        .to.emit(Delar, "LandVerified")
        .withArgs(user1.address, 0);

      const land = await Delar.lands(user1.address, 0);
      expect(land.isVerified).to.equal(true);
    });

    it("Should create, update, and cancel a listing", async function () {
      const { Delar, owner, user1 } = await loadFixture(deployRegisteredLand);

      await Delar.connect(owner).verifyLand(user1.address, 0);

      await expect(Delar.connect(user1).listLand(0, validLandParams.listingPricePerPlot))
        .to.emit(Delar, "LandListedForSale")
        .withArgs(user1.address, 0, 1, validLandParams.listingPricePerPlot);

      const landAfterList = await Delar.lands(user1.address, 0);
      expect(landAfterList.isListed).to.equal(true);
      expect(landAfterList.activeListingId).to.equal(1);

      let listings = await Delar.viewAllListings();
      expect(listings.length).to.equal(1);
      expect(listings[0].listingPricePerPlot).to.equal(validLandParams.listingPricePerPlot);

      const updatedPrice = hre.ethers.parseEther("1.5");
      await expect(Delar.connect(user1).updateListingPrice(1, updatedPrice))
        .to.emit(Delar, "LandListingPriceUpdated")
        .withArgs(1, 0, updatedPrice);

      expect((await Delar.listings(1)).listingPricePerPlot).to.equal(updatedPrice);

      await expect(Delar.connect(user1).cancelListing(1))
        .to.emit(Delar, "LandDelistedForSale")
        .withArgs(user1.address, 0, 1);

      const landAfterCancel = await Delar.lands(user1.address, 0);
      expect(landAfterCancel.isListed).to.equal(false);
      expect(landAfterCancel.activeListingId).to.equal(0);
      listings = await Delar.viewAllListings();
      expect(listings.length).to.equal(0);
    });

    it("Should reject listing unverified land", async function () {
      const { Delar, user1 } = await loadFixture(deployRegisteredLand);

      await expect(
        Delar.connect(user1).listLand(0, validLandParams.listingPricePerPlot)
      ).to.be.revertedWithCustomError(Delar, "LandIsNotVerified");
    });
  });
});
