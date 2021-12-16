// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../message-based/NonAssemblySinglePriceAware.sol";
import "../../mocks/MockStatePriceProvider.sol";

contract SampleNonAssemblySinglePriceAware is NonAssemblySinglePriceAware {
  MockStatePriceProvider mockStatePriceProvider = new MockStatePriceProvider();

  function executeWithPrice(bytes32 symbol) public returns (uint256) {
    return getPriceFromMsg(symbol);
  }

  function getTime() public view returns (uint256) {
    return block.timestamp;
  }
}
