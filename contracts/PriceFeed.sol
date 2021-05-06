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

    PriceVerifier public priceVerifier;
    uint256 public maxPriceDelay;

    //A map indicating if a signer could be trusted by a client protocol
    mapping(address => bool) trustedSigners;


    mapping(bytes32 => uint256) private prices;


    constructor(PriceVerifier _priceVerifier, uint256 _maxPriceDelay) {
        require(address(_priceVerifier) != address(0), "Cannot set an empty verifier");
        require(_maxPriceDelay > 0, "Maximum price delay must be greater than 0");
        priceVerifier = _priceVerifier;
        maxPriceDelay = _maxPriceDelay;
    }


    function setPrices(PriceData calldata priceData, bytes calldata signature) external {
        require(isSigner(priceData.signer), "Unauthorized price data signer");
        require(priceVerifier.verifyPriceData(priceData, signature), "Incorrect price data signature");
        require(block.timestamp > priceData.timestamp, "Price data timestamp cannot be from the future");
        require(block.timestamp.sub(priceData.timestamp) < maxPriceDelay, "Price data timestamp too old");

        for(uint256 i=0; i < priceData.symbols.length; i++) {
            //TODO: Change to signer
            require(prices[priceData.symbols[i]] == 0, "Cannot overwrite existing price");
            prices[priceData.symbols[i]] = priceData.prices[i];
        }
    }


    //TODO: Prevent clearing prices by a malicious actor -> add priceSetter
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
        trustedSigners[signer] = true;
    }


    function revokeSigner(address signer) external onlyOwner {
        trustedSigners[signer] = false;
    }


    function isSigner(address potentialSigner) public view returns(bool) {
        return trustedSigners[potentialSigner];
    }

}
