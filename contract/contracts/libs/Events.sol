// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

interface Events {
    event LandRegistered(address _landOwner, uint indexed _landIndex, string indexed _state, string _lga, string _city);
    event LandListedForSale(address _landOwner, uint indexed _landIndex, uint indexed _listingId, uint _pricePerPlot);
    event LandListingPriceUpdated(uint indexed _listingId, uint indexed _landIndex, uint indexed _pricePerPlot);
    event LandDelistedForSale(address _landOwner, uint indexed _landIndex, uint indexed _listingId);
    event LandVerified(address indexed _landOwner, uint indexed _landIndex);
    event LandSold(address indexed _previousOwner, address indexed _newOwner, uint indexed _amount);
     event LandNFTMinted(address indexed owner, uint indexed landIndex, uint256 tokenId);
}
