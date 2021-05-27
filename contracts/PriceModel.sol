// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;
pragma experimental ABIEncoderV2;


contract PriceModel {
    string internal constant EIP712_DOMAIN = "EIP712Domain(string name,string version,uint256 chainId)";
    bytes32 internal constant EIP712_DOMAIN_TYPEHASH = keccak256(abi.encodePacked(EIP712_DOMAIN));

    string internal constant PRICE_DATA__TYPE = "PriceData(bytes32[] symbols,uint256[] prices,uint256 timestamp,address signer)";
    bytes32 internal constant PRICE_DATA__TYPEHASH = keccak256(abi.encodePacked(PRICE_DATA__TYPE));

    struct PriceData {
        bytes32[] symbols;
        uint256[] prices;
        uint256 timestamp;
        address signer;
    }


}
