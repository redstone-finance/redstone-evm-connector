// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

contract MockStatePriceProvider {
  
  uint256 price = 2;

  function getPrice(bytes32 symbol) public view returns(uint256) {
    return price;
  }

}
