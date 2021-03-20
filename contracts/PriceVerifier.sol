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
        console.log("Recovered: ", hash.recover(signature));
        return priceData.signer == hash.recover(signature);
    }


    function hashPrices(uint256[] calldata array) internal view returns (bytes32) {
console.log("*** Array on-chain");
        //bytes32[] memory _array = new bytes32[](array.length);
        //for (uint256 i = 0; i < array.length; ++i) {
        //    _array[i] = abi.encodePacked(array[i]);
        //}
        bytes memory encoded = abi.encodePacked(array);
        console.logBytes(encoded);
        bytes32 result = keccak256(encoded);

        console.logBytes32(result);
        return result;
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
