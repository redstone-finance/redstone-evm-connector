// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;
pragma experimental ABIEncoderV2;

import './PriceVerifier.sol';
import './IPriceFeed.sol';
import 'hardhat/console.sol';
import "@openzeppelin/contracts/access/Ownable.sol";

contract PriceFeed is IPriceFeed, PriceModel, Ownable {

    PriceVerifier public priceVerifier;
    uint256 public maxPriceDelay;

    //A map indicating if a signer could be trusted by a client protocol
    mapping(address => bool) trustedSigners;
    
    //An user that sets the prices in the context of the current transaction
    address private currentSetter;

    mapping(bytes32 => uint256) private prices;


    constructor(PriceVerifier _priceVerifier, uint256 _maxPriceDelay) {
        require(address(_priceVerifier) != address(0), "Cannot set an empty verifier");
        require(_maxPriceDelay > 0, "Maximum price delay must be greater than 0");
        priceVerifier = _priceVerifier;
        maxPriceDelay = _maxPriceDelay;
    }


    function setPrices(PriceData calldata priceData, bytes calldata signature) external {
        address signer = priceVerifier.recoverDataSigner(priceData, signature);
        require(isSigner(signer), "Unauthorized price data signer");
        console.log("Signer OK");
        require(block.timestamp * 1000 > priceData.timestamp - 15000, "Price data timestamp cannot be from the future");
        console.log("BT: ", block.timestamp * 1000);
        console.log("PT: ", priceData.timestamp);
        require(block.timestamp * 1000 - priceData.timestamp < maxPriceDelay * 1000, "Price data timestamp too old");
        console.log("Timestamp OK");
        require(currentSetter == address(0), "The prices could be set only once in the transaction");

        for(uint256 i=0; i < priceData.symbols.length; i++) {
            prices[priceData.symbols[i]] = priceData.values[i];
        }

        currentSetter = msg.sender;
    }



    function clearPrices(PriceData calldata priceData) external {
        require(currentSetter == msg.sender, "The prices could be cleared only by the address which set them");
        for(uint256 i=0; i < priceData.symbols.length; i++) {
            delete prices[priceData.symbols[i]];
        }

        currentSetter = address(0);
    }


    function getPrice(bytes32 symbol) override public view returns(uint256) {
        require(prices[symbol] > 0, "No pricing data for given symbol");
        return prices[symbol];
    }


    function authorizeSigner(address signer) external onlyOwner {
        trustedSigners[signer] = true;
    }


    function revokeSigner(address signer) external onlyOwner {
        trustedSigners[signer] = false;
    }


    function isSigner(address potentialSigner) public view returns(bool) {
        return trustedSigners[potentialSigner];
    }

}
