pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import './PriceModel.sol';
import 'hardhat/console.sol';

contract PriceVerifier is PriceModel {
    using ECDSA for bytes32;

    bytes32 DOMAIN_SEPARATOR;

    constructor() public {
        DOMAIN_SEPARATOR = keccak256(abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256("Limestone"),
                keccak256("1.0.0"),
                1 //chainId -> could be fetched with assembly
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
