// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;
pragma experimental ABIEncoderV2;

import './PriceVerifier.sol';
import './PriceFeed.sol';
import 'hardhat/console.sol';

contract PriceFeedWithClearing is PriceFeed {

    // A user that sets the prices in the context of the current transaction
    address internal currentSetter;

    constructor(PriceVerifier _priceVerifier, uint256 _maxPriceDelay)
        PriceFeed(_priceVerifier, _maxPriceDelay) {}

    function clearPrices(PriceData calldata priceData) external {
        require(currentSetter == msg.sender, "The prices could be cleared only by the address which set them");
        for(uint256 i=0; i < priceData.symbols.length; i++) {
            delete prices[priceData.symbols[i]];
        }

        currentSetter = address(0);
    }

    function _setPrices(PriceData calldata priceData, bytes calldata signature) internal override {
        require(currentSetter == address(0), "The prices could be set only once in the transaction");

        super._setPrices(priceData, signature);

        currentSetter = msg.sender;
    }
}
