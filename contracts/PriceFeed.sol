pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol";
import './PriceVerifier.sol';
import 'hardhat/console.sol';

contract PriceFeed is PriceModel {

    uint256 price = 0;
    PriceVerifier priceVerifier;

    constructor(PriceVerifier _priceVerifier) {
        priceVerifier = _priceVerifier;
    }

    function setPrice(PriceData calldata priceData, bytes calldata signature) external {
        require(priceVerifier.verifyPriceData(priceData, signature), "Incorrect price data");
        price = priceData.price;
    }


    function clearPrice() external {
        price = 0;
    }

    function getPrice() public view returns(uint256) {
        return price;
    }

    function test(uint256 t) public {
        console.log("Test: ", t);
    }

}
