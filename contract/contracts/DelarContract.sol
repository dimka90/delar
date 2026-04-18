// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "./libs/Errors.sol";
import "./libs/Events.sol";
import "./interface/IERC20.sol";
import "./interface/INFT.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract DelarContract {
    address tokenAddress;
    address nftAddress;
    address public owner;
    uint public nextListingId = 1;

    mapping(uint => bool) public registeredTitles;

    struct Land {
        uint numberOfPlots;
        uint titleNumber;
        string state;
        string lga;
        string city;
        uint256 assessedValuePerPlot;
        bool isVerified;
        bool isListed;
        string imageCID;
        string coFoCID; // Certificate of Occupancy IPFS hash
        uint activeListingId;
    }

    mapping(address => Land[]) public lands;

    struct Listing {
        uint listingId;
        address owner;
        uint landIndex;
        uint256 listingPricePerPlot;
        bool active;
        uint createdAt;
        uint updatedAt;
    }

    mapping(uint => Listing) public listings;
    uint[] private activeListingIds;

    struct RegisteredLandRef {
        address owner;
        uint landIndex;
        uint titleNumber;
    }

    RegisteredLandRef[] private registeredLandRefs;
    mapping(uint => uint) private titleToRegistryIndexPlusOne;

    struct LandHistory {
        address soldFrom;
        address soldTo;
        uint amount;
        uint numberofPlots;
        uint date;
    }

    mapping(uint => LandHistory[]) public landHistoricalData;

    constructor(address _tokenAddress, address _nftAddress) {
        owner = msg.sender;
        tokenAddress = _tokenAddress;
        nftAddress = _nftAddress;
    }

    modifier onlyContractOwner() {
        if (msg.sender != owner) {
            revert Errors.NotContractOwner();
        }
        _;
    }

    // setter functions
    function registerLand(
        uint _numberOfPlots,
        string memory _state,
        string memory _lga,
        string memory _city,
        uint256 _assessedValuePerPlot,
        uint _titleNumber,
        string memory _imageCID,
        string memory _coFoCID
    ) external {
        if (_numberOfPlots == 0) {
            revert Errors.InvalidNumberOfPlots();
        }

        if (_titleNumber == 0) {
            revert Errors.InvalidTitleNumber();
        }

        if (_assessedValuePerPlot == 0) {
            revert Errors.InvalidPrice();
        }

        if (bytes(_state).length == 0 || bytes(_lga).length == 0 || bytes(_city).length == 0) {
            revert Errors.InvalidLandLocationDetails();
        }

        if (registeredTitles[_titleNumber]) {
            revert Errors.TitleExistAlready();
        }

        registeredTitles[_titleNumber] = true;

        Land memory newLand = Land({
            numberOfPlots: _numberOfPlots,
            lga: _lga,
            state: _state,
            city: _city,
            assessedValuePerPlot: _assessedValuePerPlot,
            titleNumber: _titleNumber,
            isListed: false,
            isVerified: false,
            imageCID: _imageCID,
            coFoCID: _coFoCID,
            activeListingId: 0
        });

        LandHistory memory landHistory = LandHistory({
            soldFrom: address(0),
            soldTo: msg.sender,
            amount: 0,
            numberofPlots: _numberOfPlots,
            date: block.timestamp
        });

        lands[msg.sender].push(newLand);

        uint landIndex = lands[msg.sender].length - 1;
        registeredLandRefs.push(
            RegisteredLandRef({
                owner: msg.sender,
                landIndex: landIndex,
                titleNumber: _titleNumber
            })
        );
        titleToRegistryIndexPlusOne[_titleNumber] = registeredLandRefs.length;

        landHistoricalData[_titleNumber].push(landHistory);

        INFT(nftAddress).mint(msg.sender, 1, 1, "");

        emit Events.LandRegistered(msg.sender, landIndex, _state, _lga, _city);
    }

    function verifyLand(address _landOwner, uint _landIndex) external onlyContractOwner {
        Land storage land = lands[_landOwner][_landIndex];

        if (land.numberOfPlots == 0) {
            revert Errors.InvalidLandIndex();
        }

        if (land.isVerified) {
            revert Errors.LandIsVerifiedAlready();
        }

        land.isVerified = true;

        emit Events.LandVerified(_landOwner, _landIndex);
    }

    function listLand(uint _landIndex, uint256 _listingPricePerPlot) external {
        Land storage land = lands[msg.sender][_landIndex];

        if (land.numberOfPlots == 0) {
            revert Errors.InvalidLandIndex();
        }

        if (!land.isVerified) {
            revert Errors.LandIsNotVerified();
        }

        if (land.isListed) {
            revert Errors.LandIsAlreadyForSale();
        }

        if (_listingPricePerPlot == 0) {
            revert Errors.InvalidPrice();
        }

        uint listingId = nextListingId++;

        listings[listingId] = Listing({
            listingId: listingId,
            owner: msg.sender,
            landIndex: _landIndex,
            listingPricePerPlot: _listingPricePerPlot,
            active: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        activeListingIds.push(listingId);
        land.isListed = true;
        land.activeListingId = listingId;

        emit Events.LandListedForSale(msg.sender, _landIndex, listingId, _listingPricePerPlot);
    }

    function updateListingPrice(uint _listingId, uint256 _newListingPricePerPlot) external {
        Listing storage listing = listings[_listingId];

        if (!listing.active) {
            revert Errors.ListingDoesNotExist();
        }

        if (listing.owner != msg.sender) {
            revert Errors.NotTheOwner();
        }

        if (_newListingPricePerPlot == 0) {
            revert Errors.InvalidPrice();
        }

        listing.listingPricePerPlot = _newListingPricePerPlot;
        listing.updatedAt = block.timestamp;

        emit Events.LandListingPriceUpdated(_listingId, listing.landIndex, _newListingPricePerPlot);
    }

    function cancelListing(uint _listingId) external {
        Listing storage listing = listings[_listingId];

        if (!listing.active) {
            revert Errors.ListingDoesNotExist();
        }

        if (listing.owner != msg.sender) {
            revert Errors.NotTheOwner();
        }

        _deactivateListing(_listingId);
    }

    function buyLand(uint _listingId) external {
        Listing storage listing = listings[_listingId];

        if (!listing.active) {
            revert Errors.ListingDoesNotExist();
        }

        Land storage sellerLand = lands[listing.owner][listing.landIndex];

        if (!sellerLand.isVerified) {
            revert Errors.LandIsNotVerified();
        }

        uint amountToPay = listing.listingPricePerPlot * sellerLand.numberOfPlots;

        if (IERC20(tokenAddress).balanceOf(msg.sender) < amountToPay) {
            revert Errors.InsufficientDelarTokens();
        }

        if (IERC20(tokenAddress).allowance(msg.sender, address(this)) < amountToPay) {
            revert Errors.InsufficientAllowanceToTransferDelarTokens();
        }

        Land memory buyerLand = Land({
            numberOfPlots: sellerLand.numberOfPlots,
            state: sellerLand.state,
            lga: sellerLand.lga,
            city: sellerLand.city,
            assessedValuePerPlot: sellerLand.assessedValuePerPlot,
            titleNumber: sellerLand.titleNumber,
            isVerified: true,
            isListed: false,
            imageCID: sellerLand.imageCID,
            coFoCID: sellerLand.coFoCID,
            activeListingId: 0
        });

        lands[msg.sender].push(buyerLand);
        uint buyerLandIndex = lands[msg.sender].length - 1;
        uint registryIndexPlusOne = titleToRegistryIndexPlusOne[sellerLand.titleNumber];

        if (registryIndexPlusOne != 0) {
            RegisteredLandRef storage registryRef = registeredLandRefs[registryIndexPlusOne - 1];
            registryRef.owner = msg.sender;
            registryRef.landIndex = buyerLandIndex;
        }

        LandHistory memory landHistory = LandHistory({
            soldFrom: listing.owner,
            soldTo: msg.sender,
            amount: amountToPay,
            numberofPlots: sellerLand.numberOfPlots,
            date: block.timestamp
        });

        landHistoricalData[sellerLand.titleNumber].push(landHistory);

        INFT(nftAddress).safeTransferFrom(
            listing.owner,
            msg.sender,
            1,
            1,
            ""
        );

        _deactivateListing(_listingId);

        delete lands[listing.owner][listing.landIndex];
        
        IERC20(tokenAddress).transferFrom(msg.sender, listing.owner, amountToPay);

        emit Events.LandSold(listing.owner, msg.sender, amountToPay);
        emit Events.LandNFTMinted(msg.sender, buyerLandIndex, 1);
    }

    // getter functions
    function viewAllListings() external view returns (Listing[] memory) {
        uint activeCount = activeListingIds.length;
        Listing[] memory activeListings = new Listing[](activeCount);

        for (uint i = 0; i < activeCount; i++) {
            activeListings[i] = listings[activeListingIds[i]];
        }

        return activeListings;
    }

    function veiwOwnerLands() external view returns (Land[] memory) {
        return lands[msg.sender];
    }

    function viewAllRegisteredLands() external view returns (RegisteredLandRef[] memory) {
        return registeredLandRefs;
    }

    function getRegisteredLandsCount() external view returns (uint) {
        return registeredLandRefs.length;
    }

    function getRegisteredLandRef(uint _index) external view returns (RegisteredLandRef memory) {
        return registeredLandRefs[_index];
    }

    function getLandDetails(
        address _landOwner,
        uint _landIndex
    ) external view returns (Land memory) {
        return lands[_landOwner][_landIndex];
    }

    // helper functions
    function _deactivateListing(uint _listingId) private {
        Listing storage listing = listings[_listingId];
        Land storage land = lands[listing.owner][listing.landIndex];

        if (land.numberOfPlots > 0) {
            land.isListed = false;
            land.activeListingId = 0;
        }

        listing.active = false;
        listing.updatedAt = block.timestamp;

        for (uint i = 0; i < activeListingIds.length; i++) {
            if (activeListingIds[i] == _listingId) {
                if (i < activeListingIds.length - 1) {
                    activeListingIds[i] = activeListingIds[activeListingIds.length - 1];
                }

                activeListingIds.pop();
                break;
            }
        }

        emit Events.LandDelistedForSale(listing.owner, listing.landIndex, _listingId);
    }
}
