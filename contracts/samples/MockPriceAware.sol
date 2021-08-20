// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../message-based/PriceAware.sol";
import "../mocks/MockStatePriceProvider.sol";

contract MockPriceAware is PriceAware {
  
  MockStatePriceProvider mockStatePriceProvider = new MockStatePriceProvider();


  function execute(uint val) public returns(uint256) {
    getPrice();
  }


  function executeWithPrice(uint val) public returns(uint256) {
    getPriceFromMsg(bytes32("ETH"));
  }


  function getPrice() internal view returns(uint256) {
    return mockStatePriceProvider.getPrice(bytes32("ETH"));
  }


  function getTime() public view returns(uint256) {
    return block.timestamp;
  }

}
