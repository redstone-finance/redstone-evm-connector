pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;


contract PriceModel {
    string internal constant EIP712_DOMAIN = "EIP712Domain(string name,string version,uint256 chainId)";
    bytes32 internal constant EIP712_DOMAIN_TYPEHASH = keccak256(abi.encodePacked(EIP712_DOMAIN));

    string internal constant PRICE_DATA__TYPE = "PriceData(uint256 price,uint256 timestamp,address signer)";
    bytes32 internal constant PRICE_DATA__TYPEHASH = keccak256(abi.encodePacked(PRICE_DATA__TYPE));

    struct PriceData {
        //        string symbol;
        uint256 price;
        uint256 timestamp;
        address signer;
    }


}
