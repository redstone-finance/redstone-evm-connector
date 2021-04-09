pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/proxy/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import './PriceVerifier.sol';
import './IPriceFeed.sol';
import 'hardhat/console.sol';
import "@openzeppelin/contracts/access/Ownable.sol";

contract PriceFeed is IPriceFeed, PriceModel, Ownable {
    using SafeMath for uint256;

    mapping(bytes32 => uint256) prices;
    PriceVerifier priceVerifier;
    uint256 maxPriceDelay;

    mapping(address => bool) signers;


    constructor(PriceVerifier _priceVerifier, uint256 _maxPriceDelay) {
        require(address(_priceVerifier) != address(0), "Cannot set an empty verifier");
        require(_maxPriceDelay >= 15, "Maximum price delay must be greater or equal to 15 seconds");
        priceVerifier = _priceVerifier;
        maxPriceDelay = _maxPriceDelay;
    }


    function setPrices(PriceData calldata priceData, bytes calldata signature) external {
        require(isSigner(priceData.signer), "Unauthorized price data signer");
        require(priceVerifier.verifyPriceData(priceData, signature), "Incorrect price data signature");
        require(block.timestamp > priceData.timestamp, "Price data timestamp cannot be from the future");
        require(block.timestamp.sub(priceData.timestamp) < maxPriceDelay, "Price data timestamp too old");

        for(uint256 i=0; i < priceData.symbols.length; i++) {
            require(prices[priceData.symbols[i]] == 0, "Cannot overwrite existing price");
            prices[priceData.symbols[i]] = priceData.prices[i];
        }
    }


    function clearPrices(PriceData calldata priceData) external {
        for(uint256 i=0; i < priceData.symbols.length; i++) {
            delete prices[priceData.symbols[i]];
        }
    }


    function getPrice(bytes32 symbol) external override view returns(uint256) {
        require(prices[symbol] > 0, "No pricing data for given symbol");
        return prices[symbol];
    }


    function authorizeSigner(address signer) external onlyOwner {
        signers[signer] = true;
    }


    function revokeSigner(address signer) external onlyOwner {
        signers[signer] = false;
    }


    function isSigner(address potentialSigner) public view returns(bool) {
        return signers[potentialSigner];
    }

}
