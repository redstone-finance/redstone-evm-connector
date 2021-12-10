// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../mocks/MockStatePriceProvider.sol";
import "../message-based/PriceAwareUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "hardhat/console.sol";

/**
 * @title SamplePriceAware
 * @dev An example of a contract using a message-based way of fetching data from RedStone
 * It has only a few methods used to benchmark gas consumption
 * It extends PriceAware and allows changing trusted signer and message delay
 */
contract SamplePriceAwareUpgradeable is OwnableUpgradeable, PriceAwareUpgradeable {

  MockStatePriceProvider mockStatePriceProvider = new MockStatePriceProvider();


  function initialize() external initializer {
    __Ownable_init();
    __PriceAware_init();
  }


  function getPrice(bytes32 asset) external view returns(uint32) {
    return getPriceFromMsg(asset);
  }


  function getPrices(bytes32[] memory assets) external view returns(uint32[] memory) {
    return getPricesFromMsg(assets);
  }
}
