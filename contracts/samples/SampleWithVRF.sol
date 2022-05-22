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

  function getContractPublicName() external view override returns(string memory) {
    // You can put any logic here
    // return "SampleWithVRF";
    return contractPublicName;
  }

  function updateLastRandomValue() public {
    lastRandomValue = getCurrentRandomNumber();
  }
}
