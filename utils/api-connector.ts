import { Wallet, utils } from "ethers";
import EvmPriceSigner from "redstone-node/dist/src/utils/EvmPriceSigner";
import {PricePackage} from "redstone-node/dist/src/types";
import {PriceDataType, SignedPriceDataType} from "./contract-wrapper";


const PRIV = "0xae2b81c1fe9e3b01f060362f03abd0c80a6447cfe00ff7fc7fcf000000000000";


const signer: Wallet = new Wallet(PRIV);

export function getSignedPrice(): SignedPriceDataType {

    const currentTime = Math.round(new Date().getTime());
    
    const pricePackage:PricePackage = {
        prices: [
            {symbol: "ETH", value: 10},
            {symbol: "AVAX", value: 5}
        ],
        timestamp: currentTime - 1000
    };

    const priceSigner = new EvmPriceSigner();

    const signedPackage = priceSigner.signPricePackage(pricePackage, signer.privateKey);
    
    const serializedPackege: PriceDataType = priceSigner.serializeToMessage(pricePackage) as PriceDataType;
    
    const signedPriceData: SignedPriceDataType = {
        priceData: serializedPackege,
        signer: signedPackage.signer,
        signature: signedPackage.signature
    };     
    
    return signedPriceData;    
}
