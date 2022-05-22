// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./VRFBase.sol";
import "../meta-tx/ContextMixin.sol";
import "../meta-tx/NativeMetaTransaction.sol";

// abstract contract RedStoneVRFConsumerBase is VRFBase, ContextMixin, NativeMetaTransaction {
abstract contract RedStoneVRFConsumerBase is ContextMixin, NativeMetaTransaction {

  bytes latestRandomness;

  function getContractPublicName() virtual external view returns(string memory);

  function provideRandomnessAndExecuteMetaTransaction(
    bytes memory randomness,
    address userAddress,
    bytes memory functionSignature,
    bytes32 sigR,
    bytes32 sigS,
    uint8 sigV
  ) public {
    // TODO: verify VRF proof
    latestRandomness = randomness;
    executeMetaTransaction(userAddress, functionSignature, sigR, sigS, sigV);
  }

  // TODO: implement
  function getCurrentRandomNumber() public pure returns(uint256) {
    return 42;
  }
}
