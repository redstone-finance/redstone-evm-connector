// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./PriceVerifier.sol";
import "./BytesLib.sol";
import 'hardhat/console.sol';
import './PriceFeed.sol';
import "@openzeppelin/contracts/proxy/Proxy.sol";
import 'hardhat/console.sol';


contract PriceAwareAsm is PriceFeed {
  using BytesLib for bytes;
  bytes32 constant MARKER = keccak256("Redstone.version.0.0.1");


  function toUint16(bytes memory _bytes, uint256 _start) internal pure returns (uint16) {
    uint16 tempUint;

    assembly {
      tempUint := mload(add(add(_bytes, 0x2), _start))
    }

    return tempUint;
  }

  function getPriceFromMsg(bytes32 symbol) internal view returns(uint256) {
    //We may validate marker but it costs additional 1k of gas

    //      bool isTxWithPricing = false;
    //      if (msg.data.length > 32) { //1k gas
    //        isTxWithPricing = msg.data.toBytes32(msg.data.length - 32) == MARKER;
    //      }
    //
    //      bytes memory priceData;
    //      uint16 priceDataLen;
    //
    //      if (isTxWithPricing) {



    //uint16 priceDataLen = msg.data.toUint16(msg.data.length - 34); //1030 gas      

    //        uint16 priceDataLen; //Only 28 gas
    //        assembly { 
    //          //Calldataload loads slots of 32 bytes
    //          //The last 32 bytes are for MARKER
    //          //We load the previous 32 bytes and automatically take the 2 least significant ones (casting to uint16)
    //          priceDataLen := calldataload(sub(calldatasize(), 64))
    //        }


    //bytes memory cpy;


    //priceData = msg.data.slice(msg.data.length - priceDataLen - 34, priceDataLen);
    bytes memory data = msg.data;
    bytes memory rawPriceDataAndSig;
    assembly {
      let priceDataLen := calldataload(sub(calldatasize(), 64))
      rawPriceDataAndSig := mload(0x40)
      mstore(rawPriceDataAndSig, priceDataLen)
      calldatacopy(add(rawPriceDataAndSig, 0x20), sub(calldatasize(), add(priceDataLen, 30)), sub(priceDataLen,4))
      mstore(0x40, add(rawPriceDataAndSig, add(priceDataLen, 0x20)))
    }


    //bytes memory lenBytes = msg.data.slice(msg.data.length - 34, 2);
    //console.log(callBytes.length);
    //console.logBytes32(callBytes);

    //console.logBytes(data);
    //console.logBytes(callBytes);

    //bytes32 callBytes;
    //bytes memory lenBytes = msg.data.slice(msg.data.length - 34, 2);
    //        console.logBytes(msg.data);
    //        console.logBytes32(callBytes);
    //        console.log(priceDataLen);




    //
    //        //priceData = msg.data.slice(msg.data.length - priceDataLen - 34, priceDataLen);
    // bytes memory priceData = msg.data.slice(msg.data.length - priceDataLen - 30, priceDataLen-4); //3k gas
    //priceData = msg.data.slice(msg.data.length - priceDataLen - 34, priceDataLen);
    PriceData memory pd;
    bytes memory signature;
    (pd, signature) = abi.decode(rawPriceDataAndSig, (PriceData, bytes)); //2k gas
    //console.log("Signature: ");
    //console.logBytes(signature);
    //address signer = priceVerifier.recoverDataSigner(pd, signature);

    _checkPrices(pd, signature);
    //console.log("Signer: ", signer);
    //        for(uint256 i=0; i < pd.symbols.length; i++) { //400 gas
    //          //console.log("Extracting price: ", pd.values[i]);
    //          if (pd.symbols[i] == symbol) { 
    //            return pd.values[i];
    //          }
    //        }
    //}
    return 2;
  }

}
