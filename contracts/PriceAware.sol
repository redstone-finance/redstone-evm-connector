// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./PriceVerifier.sol";
import "./BytesLib.sol";
import 'hardhat/console.sol';
import './PriceFeed.sol';
import "@openzeppelin/contracts/proxy/Proxy.sol";
import 'hardhat/console.sol';


contract PriceAware is PriceModel {
    using BytesLib for bytes;
    bytes32 constant MARKER = keccak256("Redstone.version.0.0.1");
    
    uint256 dummyStorage;
    
    uint256 constant MEM = 1111;
    
    bytes32 constant SYMBOL = bytes32("ETH");

    PriceFeed public priceFeed;
    PriceVerifier public priceVerifier = new PriceVerifier();

    constructor(PriceFeed _priceFeed) {
        priceFeed = _priceFeed;
    }

    function executePriceAware(uint val) public priceAware returns(uint256) {
        
        dummyStorage = val + getPriceFromMsg(SYMBOL);
    }


    function execute(uint val) public returns(uint256) {

        dummyStorage = val + getPrice();
    }
    
    
    function checkStorage() public view returns(uint256) {
        return dummyStorage;
    }
    
    
    function getPrice() internal view returns(uint256) {
//        uint256 price;
//        assembly {
//            price := 2
//        }
        return 2;
    }
    
    
    function getPriceFromMsg(bytes32 symbol) internal returns(uint256) {
      bool isTxWithPricing = false;
      if (msg.data.length > 32) { //1k gas
        isTxWithPricing = msg.data.toBytes32(msg.data.length - 32) == MARKER;
      }

      bytes memory priceData;
      uint16 priceDataLen;

      if (isTxWithPricing) {
        priceDataLen = msg.data.toUint16(msg.data.length - 34); //1k gas
//
//        //priceData = msg.data.slice(msg.data.length - priceDataLen - 34, priceDataLen);
        priceData = msg.data.slice(msg.data.length - priceDataLen - 30, priceDataLen-4); //3k gas
        //priceData = msg.data.slice(msg.data.length - priceDataLen - 34, priceDataLen)
        PriceData memory pd;
        bytes memory signature;
        (pd, signature) = abi.decode(priceData, (PriceData, bytes)); //2k gas
        console.log("Signature: ");
        console.logBytes(signature);
        address signer = priceVerifier.recoverDataSigner(pd, signature);
        
        console.log("Signer: ", signer);
        for(uint256 i=0; i < pd.symbols.length; i++) { //2k gas
          //console.log("Extracting price: ", pd.values[i]);
          if (pd.symbols[i] == symbol) { 
            return pd.values[i];
          }
        }
      }
        return 2;
    }
    
    
    modifier priceAware {
        bool isTxWithPricing = false;
//        if (msg.data.length > 32) {
//            isTxWithPricing = msg.data.toBytes32(msg.data.length - 32) == MARKER;
//        }
//        bytes memory priceData;
//        uint16 priceDataLen;
//        
//        if (isTxWithPricing) {
//            priceDataLen = msg.data.toUint16(msg.data.length - 34);
//            //console.log("-----PDL: ", priceDataLen);
//            //console.log("-----Total: ", msg.data.length);
//
//            priceData = msg.data.slice(msg.data.length - priceDataLen - 34, priceDataLen);
//            (bool success,) = address(priceFeed).call(priceData);
//            require(success, "Error setting price data");
//        }
        
        _;
    }

        

}
