// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.7.0;

import "./PriceFeed.sol";
import 'hardhat/console.sol';

contract MockDefi {

    PriceFeed priceFeed;

    constructor(PriceFeed _priceFeed) {
        priceFeed = _priceFeed;
    }

    mapping(address => uint256) balances;

    function deposit(uint256 amount) external {
        //To check proxy in case of reverted tx
        require(amount > 0, "Amount must be greater than zero");

        // Transfer the amount.
        uint256 price = priceFeed.getPrice("ETH");

        console.log("Depositing with price: ", price);

        balances[msg.sender] += amount * price;
    }

    function withdraw(uint256 amount) external {
        // Transfer the amount.
        balances[msg.sender] -= amount;
    }

    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }

    function getCurrentTime() public view returns(uint256) {
        return block.timestamp;
    }
}
