// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./PriceVerifier.sol";
import "./BytesLib.sol";
import 'hardhat/console.sol';
import './PriceFeed.sol';
import "@openzeppelin/contracts/proxy/Proxy.sol";
import 'hardhat/console.sol';


contract PriceAware is PriceFeed {
    using BytesLib for bytes;

    bytes32 constant MARKER = keccak256("Redstone.version.0.0.1");
    bytes32 constant SYMBOL = bytes32("ETH");

    constructor(PriceVerifier _priceVerifier, uint256 _maxPriceDelayMilliseconds)
      PriceFeed(_priceVerifier, _maxPriceDelayMilliseconds) { }

    function getPriceFromMsg(bytes32 symbol) internal view returns(uint256) {
      bool isTxWithPricing = false;
      if (msg.data.length > 32) { //1k gas
        isTxWithPricing = msg.data.toBytes32(msg.data.length - 32) == MARKER;
      }

      if (isTxWithPricing) {
        uint16 rawPriceDataAndSigLen = msg.data.toUint16(msg.data.length - 34); //1030 gas  
        bytes memory rawPriceDataAndSig = msg.data.slice(msg.data.length - rawPriceDataAndSigLen - 30, rawPriceDataAndSigLen - 4); //3k gas

        PriceData memory priceData;
        bytes memory signature;
        (priceData, signature) = abi.decode(rawPriceDataAndSig, (PriceData, bytes)); //2k gas

        _checkPrices(priceData, signature);

        for(uint256 i=0; i < priceData.symbols.length; i++) { //400 gas
          //console.log("Extracting price: ", pd.values[i]);
          if (priceData.symbols[i] == symbol) { 
            return priceData.values[i];
          }
        }        
      }
      revert("Price data not found");
    }

}
