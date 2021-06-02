import {ethers} from "hardhat";
import {PriceSigner} from "../../utils/price-signer";

const priceSigner:PriceSigner = new PriceSigner();

test('sign and verify single price', async () => {
    const PRIV = "0xae2b81c1fe9e3b01f060362f03abd0c80a6447cfe00ff7fc7fcf000000000000";
        
    const priceData = {
        symbols: ["ETH", "BTX", "AVAX"].map(ethers.utils.formatBytes32String),
        prices: [1800, 50000, 30],
        timestamp: 1
    };
    
    const signedPriceData = priceSigner.signPriceData(priceData, PRIV);
    
    expect(priceSigner.verifySignature(signedPriceData)).toBeTruthy();
});

test('sign and verify multiple prices', () => {
    
});
