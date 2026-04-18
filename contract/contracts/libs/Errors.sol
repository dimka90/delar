// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

library Errors {
    error InvalidNumberOfPlots();

    error InvalidLandLocationDetails();

    error InvalidTitleNumber();

    error InvalidPrice();

    error TitleExistAlready();

    error LandIsVerifiedAlready();

    error InvalidLandIndex();

    error LandIsNotVerified();

    error LandIsAlreadyForSale();

    error LandIsNotForSale();

    error ListingDoesNotExist();

    error NotTheOwner();

    error NotContractOwner();

    error LandIsNotValuedYet();

    error InsufficientDelarTokens();

    error InsufficientAllowanceToTransferDelarTokens();

    error NFTMintingFailed();
}
