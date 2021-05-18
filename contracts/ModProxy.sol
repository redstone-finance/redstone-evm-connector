// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "./BytesLib.sol";
import 'hardhat/console.sol';
import './PriceFeed.sol';

/**
 * @dev This abstract contract provides a fallback function that delegates all calls to another contract using the EVM
 * instruction `delegatecall`. We refer to the second contract as the _implementation_ behind the proxy, and it has to
 * be specified by overriding the virtual {_implementation} function.
 *
 * Additionally, delegation to the implementation can be triggered manually through the {_fallback} function, or to a
 * different contract through the {_delegate} function.
 *
 * The success and return data of the delegated call will be returned back to the caller of the proxy.
 */
abstract contract ModProxy {
    using BytesLib for bytes;

    bytes32 constant MARKER = keccak256("Redstone.version.0.0.1");

    /**
     * @dev Delegates the current call to `implementation`.
     *
     * This function does not return to its internall call site, it will return directly to the external caller.
     */
    function _delegate(address implementation) internal virtual {
        // solhint-disable-next-line no-inline-assembly

        PriceFeed priceFeed = getPriceFeed();

        //Check if transcation contains Limestone marker
        bool isTxWithPricing = false;
        if (msg.data.length > 32) {
            isTxWithPricing = msg.data.toBytes32(msg.data.length - 32) == MARKER;
        }


        //Register price data
        bytes memory priceData;
        uint16 priceDataLen;
        if (isTxWithPricing) {
            priceDataLen = msg.data.toUint16(msg.data.length - 34);
            //console.log("-----PDL: ", priceDataLen);
            //console.log("-----Total: ", msg.data.length);

            priceData = msg.data.slice(msg.data.length - priceDataLen - 34, priceDataLen);
            (bool success, bytes memory data) = address(priceFeed).call(priceData);
            require(success, "Error setting price data");

        }


        //Assembly version - compare gas costs
//        uint8 delegationResult;
//        //bytes memory delegationReturn;
//        assembly {
//            // Copy msg.data. We take full control of memory in this inline assembly
//            // block because it will not return to Solidity code. We overwrite the
//            // Solidity scratch pad at memory position 0.
//            calldatacopy(0, 0, 36)
//
//            // Call the implementation.
//            // out and outsize are 0 because we don't know the size yet.
//            delegationResult := delegatecall(gas(), implementation, 0, 36, 0, 0)
//
//            // Copy the returned data.
//            returndatacopy(0, 0, returndatasize())
//        }

        //Delegate the original transaction
        (bool delegationSuccess, bytes memory delegationResult) = implementation.delegatecall(msg.data);


        //Clear price data
        if (isTxWithPricing) {
            bytes memory clearDataPrefix = msg.data.slice(msg.data.length - priceDataLen - 34 - 4, 4);
            bytes memory clearData = clearDataPrefix.concat(priceData.slice(4, priceData.length - 4));
            (bool success, bytes memory data) = address(priceFeed).call(clearData);
        }


        //Return results from base method
        assembly {
            switch delegationSuccess
            // delegatecall returns 0 on error.
            case 0 { revert(add(delegationResult, 32), delegationResult) }
            default { return(add(delegationResult, 32), mload(delegationResult)) }
        }
    }

    /**
     * @dev This is a virtual function that should be overriden so it returns the address to which the fallback function
     * and {_fallback} should delegate.
     */
    function _implementation() internal view virtual returns (address);

    function getPriceFeed() internal view virtual returns (PriceFeed);

    /**
     * @dev Delegates the current call to the address returned by `_implementation()`.
     *
     * This function does not return to its internall call site, it will return directly to the external caller.
     */
    function _fallback() internal virtual {
        _beforeFallback();

        _delegate(_implementation());
    }

    /**
     * @dev Fallback function that delegates calls to the address returned by `_implementation()`. Will run if no other
     * function in the contract matches the call data.
     */
    fallback () external payable virtual {
    _fallback();
    }

    /**
     * @dev Fallback function that delegates calls to the address returned by `_implementation()`. Will run if call data
     * is empty.
     */
    receive () external payable virtual {
    _fallback();
    }

    /**
     * @dev Hook that is called before falling back to the implementation. Can happen as part of a manual `_fallback`
     * call, or as part of the Solidity `fallback` or `receive` functions.
     *
     * If overriden should call `super._beforeFallback()`.
     */
    function _beforeFallback() internal virtual {
    }
}
