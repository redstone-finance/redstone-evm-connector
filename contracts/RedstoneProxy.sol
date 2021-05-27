// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./RedstoneCoreProxy.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Upgrade.sol";


/**
 * @dev This contract implements an upgradeable proxy. It is upgradeable because calls are delegated to an
 * implementation address that can be changed. This address is stored in storage in the location specified by
 * https://eips.ethereum.org/EIPS/eip-1967[EIP1967], so that it doesn't conflict with the storage layout of the
 * implementation behind the proxy.
 */
contract RedstoneProxy is RedstoneCoreProxy, ERC1967Upgrade {
    address priceFeed;
    
    
    /**
     * @dev Initializes the upgradeable proxy with an initial implementation specified by `_logic`.
     *
     * If `_data` is nonempty, it's used as data in a delegate call to `_logic`. This will typically be an encoded
     * function call, and allows initializating the storage of the proxy like a Solidity constructor.
     */
    constructor(address _logic, address _priceFeedAddress, bytes memory _data) payable {
        assert(_IMPLEMENTATION_SLOT == bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1));
        priceFeed = _priceFeedAddress;
        _upgradeToAndCall(_logic, _data, false);
    }
    

    /**
     * @dev Returns the current implementation address.
     */
    function _implementation() internal view virtual override returns (address impl) {
        return ERC1967Upgrade._getImplementation();
    }
    

    /**
     * @dev Returns the current price feed address
     */
    function _priceFeed() internal view override returns (address) {
        return priceFeed;
    }
}
