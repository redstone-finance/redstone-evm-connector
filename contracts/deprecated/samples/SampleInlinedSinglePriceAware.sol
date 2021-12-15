// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../message-based/InlinedSinglePriceAware.sol";
import "../../mocks/MockStatePriceProvider.sol";

/**
 * @title SampleInlinedSinglePriceAware
 * @dev An example of a contract using message-based way of fetching data from RedStone
 * It has only a few dummy methods used to benchmark gas consumption
 * It extends InlinedPriceAware which in-lines signer address and maximum delay of price feed
 * to reduce the gas of every invocation (saving is ~4k gas)
 */
contract SampleInlinedSinglePriceAware is InlinedSinglePriceAware {

  MockStatePriceProvider mockStatePriceProvider = new MockStatePriceProvider();


  function execute(bytes32 symbol) public returns(uint256) {
    return getPrice(symbol);
  }


  function executeWithPrice(bytes32 symbol) public returns(uint256) {
    return getPriceFromMsg(symbol);
  }


  function getPriceFromMsgPublic(bytes32 symbol) public view returns(uint256) {
    return getPriceFromMsg(symbol);
  }


  function getPrice(bytes32 symbol) internal view returns(uint256) {
    return mockStatePriceProvider.getPrice(symbol);
  }


  function getTime() public view returns(uint256) {
    return block.timestamp;
  }

}
