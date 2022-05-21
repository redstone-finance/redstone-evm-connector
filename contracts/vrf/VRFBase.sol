// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./VRF.sol";

contract VRFBase {

  bool public lastVerificationResult;

  function functionUsingVRF(
    bytes memory _publicKey,
    bytes memory _proof,
    bytes memory _message)
  external
  {
    uint256[4] memory proof = VRF.decodeProof(_proof);
    uint256[2] memory publicKey = VRF.decodePoint(_publicKey);
    lastVerificationResult = VRF.verify(publicKey, proof, _message);
  }

  function optimisedFunctionUsingVRF(
    uint256[2] memory _publicKey,
    uint256[4] memory _proof,
    bytes memory _message,
    uint256[2] memory _uPoint,
    uint256[4] memory _vComponents)
  external
  {
    lastVerificationResult = VRF.fastVerify(_publicKey, _proof, _message, _uPoint, _vComponents);
  }

  function computeFastVerifyParams(
    uint256[2] memory _publicKey,
    uint256[4] memory _proof,
    bytes memory _message)
  external pure returns (uint256[2] memory, uint256[4] memory)
  {
    return VRF.computeFastVerifyParams(_publicKey, _proof, _message);
  }

  function gammaToHash(uint256 _gammaX, uint256 _gammaY) external pure returns (bytes32) {
    return VRF.gammaToHash(_gammaX, _gammaY);
  }

  function decodeProof(bytes memory _proof) external pure returns (uint[4] memory) {
    return VRF.decodeProof(_proof);
  }

  function decodePoint(bytes memory _point) external pure returns (uint[2] memory) {
    return VRF.decodePoint(_point);
  }

}
