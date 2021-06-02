import { Wallet, utils } from "ethers";
import {PriceDataType, SignedPriceDataType, PriceSigner} from './price-signer';


const PRIV = "0xae2b81c1fe9e3b01f060362f03abd0c80a6447cfe00ff7fc7fcf000000000000";

const signer: Wallet = new Wallet(PRIV);

export function getSignedPrice(): SignedPriceDataType {

    const currentTime = Math.round(new Date().getTime()/1000);
    const priceSigner = new PriceSigner("1.0.0", 7);

    const priceData : PriceDataType = {
        symbols: ["ETH", "AVAX"].map(utils.formatBytes32String),
        prices: [10, 5],
        timestamp: currentTime
    };

    return priceSigner.signPriceData(priceData, signer.privateKey);
}
