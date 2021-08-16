// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./PriceVerifier.sol";
import "./BytesLib.sol";
import 'hardhat/console.sol';
import './PriceFeed.sol';
import "@openzeppelin/contracts/proxy/Proxy.sol";
import 'hardhat/console.sol';
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";



contract PriceAwareAsm  {
  using ECDSA for bytes32;
  using BytesLib for bytes;
  bytes32 constant MARKER = keccak256("Redstone.version.0.0.1");
  
  uint constant MAX_DELAY = 3 * 60;
  address constant TRUSTED_SIGNER = 0xFE71e9691B9524BC932C23d0EeD5c9CE41161884;

  function getPriceFromMsg(bytes32 symbol) internal view returns(uint256) {


    uint8 dataSize; //Number of data entries    
    //Saving ~1k of gas
    assembly { 
      //Calldataload loads slots of 32 bytes
      //The last 65 bytes are for signature
      //We load the previous 32 bytes and automatically take the 2 least significant ones (casting to uint16)
      dataSize := calldataload(sub(calldatasize(), 97))
    }
    
    //dataSizeLen(1) + (symbolLen(32) + valueLen(32)) * dataSize
    uint16 messageLength = dataSize * 64 + 32; //Length of data message in bytes
    
    
    //bytes memory rawData = msg.data.slice(msg.data.length - messageLength - 65, messageLength);
    //Saving ~2k of gas
    bytes memory rawData;
    assembly {
      rawData := mload(0x40)
      mstore(rawData, messageLength)
      //The starting point is callDataSize minus length of data(messageLength), signature(65) and size(1) = 66
      calldatacopy(add(rawData, 0x20), sub(calldatasize(), add(messageLength, 66)), messageLength)
      mstore(0x40, add(rawData, 0x20))
    }    
    
    
    bytes32 hash = keccak256(rawData);
    bytes32 hashWithPrefix = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));

    //bytes memory signature = msg.data.slice(msg.data.length - 65, 65);
    bytes memory signature;
    assembly {
      signature := mload(0x40)
      mstore(signature, 65)
      calldatacopy(add(signature, 0x20), sub(calldatasize(), 65), 65)
      mstore(0x40, add(signature, 0x20))
    }
    
    address signer = hashWithPrefix.recover(signature);
    require(signer == TRUSTED_SIGNER, "Signer not authorized");

    uint256 dataTimestamp;
    assembly {
      //Calldataload loads slots of 32 bytes
      //The last 65 bytes are for signature + 1 for data size
      //We load the previous 32 bytes
      dataTimestamp := calldataload(sub(calldatasize(), 98))
    }    
    require(block.timestamp - dataTimestamp < MAX_DELAY, "Data is too old");
    
//    console.log("Len: ", messageLength);
//    console.logBytes(rawData);
//    console.logBytes32(hash);
//    console.logBytes(signature);
//    console.log("Signer: ", signer);


    uint256 val;
    uint256 max = dataSize;
    bytes32 current;
    uint256 i;
    assembly {
      let start := sub(calldatasize(), add(messageLength, 65))
      for { i := 0 } lt(i, max) { i := add(i, 1) } {
        val := calldataload(add(start, add(32, mul(i, 64))))
        current := calldataload(add(start, mul(i, 64)))
        if eq(current, symbol) { i := max }
      }
    }
    
    return val;
  }

}
