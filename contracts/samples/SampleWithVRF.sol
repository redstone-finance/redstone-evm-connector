// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../vrf/RedStoneVRFConsumerBase.sol";

contract SampleWithVRF is RedStoneVRFConsumerBase {

  uint256 public lastRandomValue;

  function updateLastRandomValue() public {
    lastRandomValue = getCurrentRandomNumber();
  }
}
