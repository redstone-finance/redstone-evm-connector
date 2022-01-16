// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../../mocks/MockStatePriceProvider.sol";
import "../message-based/SinglePriceAware.sol";

/**
 * @title SampleSinglePriceAware
 * @dev An example of a contract using a message-based way of fetching data from RedStone
 * It has only a few methods used to benchmark gas consumption
 * It extends PriceAware and allows changing trusted signer and message delay
 */
contract SampleSinglePriceAware is SinglePriceAware {
  MockStatePriceProvider mockStatePriceProvider = new MockStatePriceProvider();

  function executeWithPrice(bytes32 symbol) public returns (uint256) {
    return getPriceFromMsg(symbol);
  }

  function getTime() public view returns (uint256) {
    return block.timestamp;
  }
}
