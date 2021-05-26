// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./BytesLib.sol";
import 'hardhat/console.sol';
import './PriceFeed.sol';
import "@openzeppelin/contracts/proxy/Proxy.sol";

abstract contract RedstoneProxy is Proxy {
    using BytesLib for bytes;

    bytes32 constant MARKER = keccak256("Redstone.version.0.0.1");

    /**
     * @dev Delegates the current call to `implementation`.
     *
     * It extracts the pricing data and keep it in the storage of priceFeed contract. 
     * Then it forwards the call to the implementation recording the results. 
     * As the last step it cleans the data from priceFeed to save on gas fees
     * and forwards the results to the caller.
     */
    function _delegate(address implementation) internal override {
        // solhint-disable-next-line no-inline-assembly

        PriceFeed priceFeed = _priceFeed();

        //Check if transaction contains Limestone marker
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
            (bool success,) = address(priceFeed).call(priceData);
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
            address(priceFeed).call(clearData);
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
     * @dev This is a virtual function that should be overriden
     * to return the address of the contract which keeps the prices on-chain
     */
    function _priceFeed() internal view virtual returns (PriceFeed);

}
