// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "../message-based/PriceAware.sol";

contract SampleWithEvents is PriceAware {

  event PriceUpdated(uint256 _ethPrice);

  function isSignerAuthorized(address _receviedSigner) public override virtual view returns (bool) {
    // For redstone-avalanche-prod price feed (it has 2 authorised signers)
    return _receviedSigner == 0x981bdA8276ae93F567922497153de7A5683708d3
      || _receviedSigner == 0x3BEFDd935b50F172e696A5187DBaCfEf0D208e48;
  }

  function emitEventWithLatestEthPrice() public {
    uint256 ethPrice = getPriceFromMsg(bytes32("ETH"));
    emit PriceUpdated(ethPrice);
  }
}
