// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../message-based/NonAssemblySinglePriceAware.sol";
import "../../mocks/MockStatePriceProvider.sol";

contract SampleNonAssemblySinglePriceAware is NonAssemblySinglePriceAware {
  
  MockStatePriceProvider mockStatePriceProvider = new MockStatePriceProvider();


  function execute(bytes32 symbol) public returns(uint256) {
    return getAssetPrice(symbol);
  }


  function executeWithPrice(bytes32 symbol) public returns(uint256) {
    return getAssetPrice(symbol);
  }


  function getAssetPrice(bytes32 symbol) internal view returns(uint256) {
    return mockStatePriceProvider.getPrice(symbol);
  }


  function getTime() public view returns(uint256) {
    return block.timestamp;
  }

}
