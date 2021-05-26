// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import './PriceModel.sol';
import 'hardhat/console.sol';

contract PriceVerifier is PriceModel {
    using ECDSA for bytes32;

    bytes32 DOMAIN_SEPARATOR;

    constructor() {
        //Get chainId from assembly
        uint256 chainId;
        assembly {
            chainId := chainid()
        }

        DOMAIN_SEPARATOR = keccak256(abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256("Redstone"),
                keccak256("1.0.0"),
                chainId
            ));
    }


    function verifyPriceData(PriceData calldata priceData, bytes calldata signature) external view returns (bool) {
        bytes32 hash = hashPriceData(priceData);
        return priceData.signer == hash.recover(signature);
    }


    function hashPriceData(PriceData calldata priceData) public view returns (bytes32) {
        return keccak256(abi.encodePacked(
            "\x19\x01",
            DOMAIN_SEPARATOR,
            keccak256(abi.encode(
                PRICE_DATA__TYPEHASH,
                keccak256(abi.encodePacked(priceData.symbols)),
                keccak256(abi.encodePacked(priceData.prices)),
                priceData.timestamp,
                priceData.signer
            ))
        ));
    }

}
