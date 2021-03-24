pragma solidity ^0.7.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import './IPriceFeed.sol';
import 'hardhat/console.sol';

contract MockPriceFeed is IPriceFeed {
    using SafeMath for uint256;

    mapping(bytes32 => uint256) prices;


    function setPrice(bytes32 symbol, uint256 value) external {
        prices[symbol] = value;
    }



    function getPrice(bytes32 symbol) external override returns(uint256) {
        require(prices[symbol] > 0, "No pricing data for given symbol");
        return prices[symbol];
    }

}
