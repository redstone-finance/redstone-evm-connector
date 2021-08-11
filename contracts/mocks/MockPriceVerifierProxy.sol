// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import '../PriceVerifier.sol';

contract MockPriceVerifierProxy is PriceVerifier {

  function recoverDataSignerPublic(PriceData memory priceData, bytes memory signature) public view returns (address) {
    return recoverDataSigner(priceData, signature);
  }

}
