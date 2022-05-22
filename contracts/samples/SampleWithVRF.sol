// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../vrf/RedStoneVRFConsumerBase.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract SampleWithVRF is RedStoneVRFConsumerBase, ERC721 {

  string contractPublicName;
  uint256 public lastRandomValue;

  constructor (string memory name_, string memory symbol_) ERC721(name_, symbol_) {
    _initializeEIP712(name_);
    contractPublicName = name_;
  }

  // TODO: add logic for VRF verification on-chain
  // function isPubKeyAuthorised(bytes memory publicKey) override public view returns(bool) {
  //   return publicKey == bytes(0x038c458504ce263294a0a458a6e730e8c2e637d3bbf5ecb3c89b3c66f9cb2023bf);
  // }

  function getContractPublicName() external view override returns(string memory) {
    // You can put any logic here
    // return "SampleWithVRF";
    return contractPublicName;
  }

  function updateLastRandomValue() public {
    lastRandomValue = getCurrentRandomNumber();
  }
}
