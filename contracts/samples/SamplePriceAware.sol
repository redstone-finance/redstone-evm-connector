// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../mocks/MockStatePriceProvider.sol";
import "../message-based/PriceAware.sol";

/**
 * @title SamplePriceAware
 * @dev An example of a contract using a message-based way of fetching data from RedStone
 * It has only a few methods used to benchmark gas consumption
 * It extends PriceAware and allows changing trusted signer and message delay
 */
contract SamplePriceAware is PriceAware {

  function getPrice(bytes32 asset) external view returns (uint256) {
    return getPriceFromMsg(asset);
  }

  function executeWithPrice(bytes32 asset) public returns (uint256) {
    return getPriceFromMsg(asset);
  }

  function executeWithPrices(bytes32[] memory assets) public returns (uint256[] memory)
  {
    return getPricesFromMsg(assets);
  }

  //for tests of ProxyConnector
  function getPriceManyParameters (
    bytes32 asset,
    uint256 mockArg1,
    string memory mockArg2,
    string memory mockArg3,
    string memory mockArg4,
    string memory mockArg5,
    string memory mockArg6
  ) external view returns (uint256) {
    return getPriceFromMsg(asset);
  }

  function a() external view returns (uint256) {
    return getPriceFromMsg(bytes32("ETH"));
  }
}
