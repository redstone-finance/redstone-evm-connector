pragma solidity ^0.7.0;

import "./PriceFeed.sol";
import 'hardhat/console.sol';

/***
 * It simulates a simple defi protocol that allows depositing tokens,
 * getting their current valuation and swapping between each other based on the current price
*/
contract MockDefi {

    PriceFeed priceFeed;

    bytes32[2] allowedAssets = [bytes32("ETH"), bytes32("AVAX")];

    constructor(PriceFeed _priceFeed) {
        priceFeed = _priceFeed;
    }

    mapping(address =>mapping(bytes32 => uint256)) balances;

    function deposit(bytes32 symbol, uint256 amount) external {
        //To check proxy in case of reverted tx
        require(amount > 0, "Amount must be greater than zero");

        balances[msg.sender][symbol] += amount;
    }

    function swap(bytes32 fromSymbol, bytes32 toSymbol, uint256 amount) external {
        balances[msg.sender][fromSymbol] -= amount;
        balances[msg.sender][toSymbol] += amount * priceFeed.getPrice(fromSymbol) / priceFeed.getPrice(toSymbol);
    }

    function balanceOf(address account, bytes32 symbol) external view returns (uint256) {
        return balances[account][symbol];
    }

    function currentValueOf(address account, bytes32 symbol) external view returns (uint256) {
        uint256 price = priceFeed.getPrice(symbol);

        console.log("Price: ", price);

        return balances[account][symbol] * price;
    }

    function getCurrentTime() public view returns(uint256) {
        return block.timestamp;
    }
}
