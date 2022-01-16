// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

abstract contract ProxyConnector {

  function proxyCalldata(address contractAddress, bytes memory encodedFunction) internal returns (bytes memory) {
    uint8 dataSize;

    assembly {
      dataSize := calldataload(sub(calldatasize(), 97))
    }

    uint16 messageLength = uint16(dataSize) * 64 + 32 + 1 + 65; //datapoints + timestamp + data size + signature

    uint256 encodedFunctionLength = encodedFunction.length;

    uint256 i;
    bytes memory message;

    assembly {
      message := mload(0x40)

      mstore(message, add(encodedFunctionLength, messageLength))

      for { i := 0 } lt(i, encodedFunctionLength) { i := add(i, 1) } {
        mstore(add(add(0x20, message), mul(0x20, i)), mload(add(add(0x20, encodedFunction), mul(0x20, i))))
      }

      calldatacopy(
        add(message, add(0x20, encodedFunctionLength)),
        sub(calldatasize(), messageLength),
        messageLength
      )

      mstore(0x40, add(add(message, add(messageLength, encodedFunctionLength)), 0x20))
    }

    (bool success, bytes memory result) = contractAddress.call(message);

    require(success, 'Proxy connector call failed');

    return result;
  }
}
