// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../mocks/MockStatePriceProvider.sol";
import "../message-based/PriceAwareAsm.sol";

/**
 * @title SamplePriceAwareAsm
 * @dev An example of a contract using message-based way of fetching data from RedStone
 * It has only a few dummy methods used to benchmark gas consumption
 * It extends PriceAwareAsm and allows changing trusted signer and message delay
 */
contract SamplePriceAwareAsm is PriceAwareAsm {

  MockStatePriceProvider mockStatePriceProvider = new MockStatePriceProvider();


  function execute(uint val) public returns(uint256) {
    return getPrice();
  }


  function executeWithPrice(uint val) public returns(uint256) {
    return getPriceFromMsg(bytes32("ETH"));
  }


  function getPrice() internal view returns(uint256) {
    return mockStatePriceProvider.getPrice(bytes32("ETH"));
  }


  function getTime() public view returns(uint256) {
    return block.timestamp;
  }

}
