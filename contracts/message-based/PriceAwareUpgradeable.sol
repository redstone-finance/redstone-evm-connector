// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract PriceAwareUpgradeable is OwnableUpgradeable {
    using ECDSA for bytes32;

    uint public maxDelay;
    address private trustedSigner;


    function getTrustedSigner() virtual public view returns (address) {
        return trustedSigner;
    }


    function __PriceAware_init() internal initializer {
        maxDelay = 3 * 60;
    }


    function setMaxDelay(uint256 _maxDelay) onlyOwner external {
        maxDelay = _maxDelay;
    }


    function authorizeSigner(address _trustedSigner) onlyOwner external {
        require(_trustedSigner != address(0));
        trustedSigner = _trustedSigner;


        emit TrustedSignerChanged(trustedSigner);
    }


    function getPricesFromMsg(bytes32[] memory symbols) internal view returns (uint256[] memory) {
        return _getPricesFromMsg(symbols);
    }


    function getPriceFromMsg(bytes32 symbol) internal view returns (uint256) {
        bytes32[] memory symbols = new bytes32[](1);
        symbols[0] = symbol;
        return _getPricesFromMsg(symbols)[0];
    }


    function _getPricesFromMsg(bytes32[] memory symbols) private view returns (uint256[] memory) {
        //The structure of calldata witn n - data items:
        //The data that is signed (symbols, values, timestamp) are inside the {} brackets
        //[origina_call_data| ?]{[[symbol | 32][value | 32] | n times][timestamp | 32]}[size | 1][signature | 65]


        //1. First we extract dataSize - the number of data items (symbol,value pairs) in the message
        uint8 dataSize;
        //Number of data entries
        assembly {
        //Calldataload loads slots of 32 bytes
        //The last 65 bytes are for signature
        //We load the previous 32 bytes and automatically take the 2 least significant ones (casting to uint16)
            dataSize := calldataload(sub(calldatasize(), 97))
        }


        // 2. We calculate the size of signable message expressed in bytes
        // ((symbolLen(32) + valueLen(32)) * dataSize + timeStamp length
        uint16 messageLength = uint16(dataSize) * 64 + 32;
        //Length of data message in bytes

        // 3. We extract the signableMessage

        //(That's the high level equivalent 2k gas more expensive)
        //bytes memory rawData = msg.data.slice(msg.data.length - messageLength - 65, messageLength);

        bytes memory signableMessage;
        assembly {
            signableMessage := mload(0x40)
            mstore(signableMessage, messageLength)
        //The starting point is callDataSize minus length of data(messageLength), signature(65) and size(1) = 66
            calldatacopy(add(signableMessage, 0x20), sub(calldatasize(), add(messageLength, 66)), messageLength)
            mstore(0x40, add(signableMessage, 0x20))
        }


        // 4. We first hash the raw message and then hash it again with the prefix
        // Following the https://github.com/ethereum/eips/issues/191 standard
        bytes32 hash = keccak256(signableMessage);
        bytes32 hashWithPrefix = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));

        // 5. We extract the off-chain signature from calldata

        //(That's the high level equivalent 2k gas more expensive)
        //bytes memory signature = msg.data.slice(msg.data.length - 65, 65);
        bytes memory signature;
        assembly {
            signature := mload(0x40)
            mstore(signature, 65)
            calldatacopy(add(signature, 0x20), sub(calldatasize(), 65), 65)
            mstore(0x40, add(signature, 0x20))
        }

        // 6. We verify the off-chain signature against on-chain hashed data

        address signer = hashWithPrefix.recover(signature);
        require(signer == getTrustedSigner(), "Signer not authorized");

        //7. We extract timestamp from callData

        uint256 dataTimestamp;
        assembly {
        //Calldataload loads slots of 32 bytes
        //The last 65 bytes are for signature + 1 for data size
        //We load the previous 32 bytes
            dataTimestamp := calldataload(sub(calldatasize(), 98))
        }

        require(block.timestamp - dataTimestamp < maxDelay, "Data is too old");

        //We iterate directly through call data to extract the values of symbols

        return _readFromCallData(symbols, uint256(dataSize), messageLength);
    }


    function _readFromCallData(bytes32[] memory symbols, uint256 dataSize, uint16 messageLength) private view returns (uint256[] memory) {
        uint256[] memory values;
        uint256 i;
        uint256 j;
        uint256 readyAssets;
        bytes32 currentSymbol;

        assembly {
            let start := sub(calldatasize(), add(messageLength, 66))

            values := msize()
            mstore(values, mload(symbols))
            mstore(0x40, add(add(values, 0x20), mul(mload(symbols), 0x20)))

            for { i := 0 } lt(i, dataSize) { i := add(i, 1) } {
                currentSymbol := calldataload(add(start, mul(i, 64)))

                for { j := 0 } lt(j, mload(symbols)) { j := add(j, 1) } {
                    if eq(mload(add(add(symbols, 32), mul(j, 32))), currentSymbol) {
                        mstore(add(add(values, 32), mul(j, 32)), calldataload(add(add(start, mul(i, 64)), 32)))
                        readyAssets := add(readyAssets, 1)
                    }

                    if eq(readyAssets, mload(symbols)) {i := dataSize}
                }
            }
        }

        return (values);
    }


    /* ========== EVENTS ========== */


    /**
      * @dev emitted after the owner updates trusted signer
      * @param newSigner the address of the new signer
    **/
    event TrustedSignerChanged(address indexed newSigner);

}
