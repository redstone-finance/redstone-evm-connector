// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./PriceAwareOwnable.sol";

contract PriceAwareUpgradeable is PriceAware, OwnableUpgradeable {

  address private trustedSigner;

  function getTrustedSigner() public view virtual returns (address) {
    return trustedSigner;
  }

  function __PriceAware_init() internal initializer {
    maxDelay = 3 * 60;
  }

  function authorizeSigner(address _trustedSigner) external onlyOwner {
    require(_trustedSigner != address(0));
    trustedSigner = _trustedSigner;

    emit TrustedSignerChanged(trustedSigner);
  }

  /* ========== OVERRIDEN FUNCTIONS ========== */

  function setMaxDelay(uint256 _maxDelay) external override virtual onlyOwner {
    maxDelay = _maxDelay;
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
