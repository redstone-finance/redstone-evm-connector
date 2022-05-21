// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./VRFBase.sol";
import "../meta-tx/ContextMixin.sol";
import "../meta-tx/NativeMetaTransaction.sol";

contract RedStoneVRFConsumerBase is VRFBase, ContextMixin, NativeMetaTransaction {

  // TODO: implement
  function getCurrentRandomNumber() public pure returns(uint256) {
    return 42;
  }
}
