pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import './PriceVerifier.sol';
import 'hardhat/console.sol';

contract PriceFeed is PriceModel {
    using SafeMath for uint256;

    mapping(bytes32 => uint256) prices;
    PriceVerifier priceVerifier;
    uint256 maxPriceDelay = 5 minutes;

    //TODO: add owner with ability to change delay and verifier
    constructor(PriceVerifier _priceVerifier) {
        priceVerifier = _priceVerifier;
    }

    function setPrices(PriceData calldata priceData, bytes calldata signature) external {
        require(priceVerifier.verifyPriceData(priceData, signature), "Incorrect price data signature");
        require(
            block.timestamp > priceData.timestamp
            && block.timestamp.sub(priceData.timestamp) <= maxPriceDelay,
            "Incorrect price feed time"
        );
        for(uint256 i=0; i < priceData.symbols.length; i++) {
            prices[priceData.symbols[i]] = priceData.prices[i];
        }
    }


    function clearPrices(PriceData calldata priceData) external {
        console.log("CLEAR DATA:");
        for(uint256 i=0; i < priceData.symbols.length; i++) {
            delete prices[priceData.symbols[i]];
        }
    }

    function getPrice(bytes32 symbol) public view returns(uint256) {
        require(prices[symbol] > 0, "No pricing data");
        return prices[symbol];
    }

}
