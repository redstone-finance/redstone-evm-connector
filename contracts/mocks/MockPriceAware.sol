// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../PriceAware.sol";

contract MockPriceAware is PriceAware {


  constructor(uint256 _maxPriceDelayMilliseconds)
    PriceAware(_maxPriceDelayMilliseconds) { }

  function execute(uint val) public returns(uint256) {
    getPrice();
  }


  function executeWithPrice(uint val) public returns(uint256) {
    getPriceFromMsg(SYMBOL);
  }


  function getPrice() internal view returns(uint256) {
    return 2;
  }  

}
