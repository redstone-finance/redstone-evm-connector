// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;
pragma experimental ABIEncoderV2;

import './PriceVerifier.sol';
import './IPriceFeed.sol';
import 'hardhat/console.sol';
import "@openzeppelin/contracts/access/Ownable.sol";

contract PriceFeed is IPriceFeed, PriceModel, Ownable {

    PriceVerifier public priceVerifier;
    uint256 public maxPriceDelayMilliseconds;

    // A map indicating if a signer could be trusted by a client protocol
    mapping(address => bool) trustedSigners;

    mapping(bytes32 => uint256) internal prices;

    constructor(PriceVerifier _priceVerifier, uint256 _maxPriceDelayMilliseconds) {
        require(address(_priceVerifier) != address(0), "Cannot set an empty verifier");
        require(_maxPriceDelayMilliseconds > 0, "Maximum price delay must be greater than 0");
        priceVerifier = _priceVerifier;
        maxPriceDelayMilliseconds = _maxPriceDelayMilliseconds;
    }


    function setPrices(PriceData calldata priceData, bytes calldata signature) external {
        _setPrices(priceData, signature);
    }

    function _setPrices(PriceData calldata priceData, bytes calldata signature) internal virtual {
        address signer = priceVerifier.recoverDataSigner(priceData, signature);
        uint256 blockTimestampMillseconds = block.timestamp * 1000;

        require(isSigner(signer), "Unauthorized price data signer");
        // TODO: check the problem with prices on Kovan
        require(blockTimestampMillseconds > priceData.timestamp - 15000, "Price data timestamp cannot be from the future");
        require(blockTimestampMillseconds - priceData.timestamp < maxPriceDelayMilliseconds, "Price data timestamp too old");

        // TODO: later we can implement rules for update skipping
        // e.g. if price has chhanged insignifficantly
        // or if current time is too close to the last updated time
        for (uint256 i = 0; i < priceData.symbols.length; i++) {
            prices[priceData.symbols[i]] = priceData.values[i];
        }
    }


    function getPrice(bytes32 symbol) override public view returns(uint256) {
        require(prices[symbol] > 0, "No pricing data for given symbol");
        return prices[symbol];
    }


    function authorizeSigner(address signer) external onlyOwner {
        trustedSigners[signer] = true;
    }


    function revokeSigner(address signer) external onlyOwner {
        delete trustedSigners[signer];
    }


    function isSigner(address potentialSigner) public view returns(bool) {
        return trustedSigners[potentialSigner];
    }

}
