pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol";
import './PriceVerifier.sol';
import 'hardhat/console.sol';

contract PriceFeed is PriceModel {

    mapping(bytes32 => uint256) prices;
    PriceVerifier priceVerifier;

    constructor(PriceVerifier _priceVerifier) {
        priceVerifier = _priceVerifier;
    }

    function setPrices(PriceData calldata priceData, bytes calldata signature) external {
        require(priceVerifier.verifyPriceData(priceData, signature), "Incorrect price data");
        for(uint256 i=0; i < priceData.symbols.length; i++) {
            prices[priceData.symbols[i]] = priceData.prices[i];
        }
    }


    function clearPrices(bytes32 symbol) external {
        //TODO: Use priceData stripped from ModProxy
        delete prices["ETH"];
        delete prices["AR"];
    }

    function getPrice(bytes32 symbol) public view returns(uint256) {
        require(prices[symbol] > 0, "No pricing data");
        return prices[symbol];
    }

}
