// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PriceAware.sol";

contract PriceAwareOwnable is PriceAware, Ownable {

  address private trustedSigner;

  function getTrustedSigner() public view virtual returns (address) {
    return trustedSigner;
  }

  function setMaxDelay(uint256 _maxDelay) external override virtual onlyOwner {
    maxDelay = _maxDelay;
  }

  function authorizeSigner(address _trustedSigner) external onlyOwner {
    require(_trustedSigner != address(0));
    trustedSigner = _trustedSigner;

    emit TrustedSignerChanged(trustedSigner);
  }

  function isSignerAuthorized(address _receviedSigner) internal override virtual view returns (bool) {
    return _receviedSigner == getTrustedSigner();
  }

  /* ========== EVENTS ========== */

  /**
   * @dev emitted after the owner updates trusted signer
   * @param newSigner the address of the new signer
   **/
  event TrustedSignerChanged(address indexed newSigner);
}
