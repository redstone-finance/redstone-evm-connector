
import { Wallet, utils } from "ethers";
import { signPriceData } from './price-signer';

export interface SignedPrice {
    priceData: any;
    signature: string;
};


const PRIV = "0xae2b81c1fe9e3b01f060362f03abd0c80a6447cfe00ff7fc7fcf000000000000";

const signer: Wallet = new Wallet(PRIV);

export function getSignedPrice(): SignedPrice {

    let currentTime = Math.round(new Date().getTime()/1000);

    let priceData = {
        symbols: ["ETH"].map(utils.formatBytes32String),
        prices: [1800],
        timestamp: currentTime,
        signer: signer.address
    };

    let signature = signPriceData(priceData, signer.privateKey);

    return {priceData, signature};

}
