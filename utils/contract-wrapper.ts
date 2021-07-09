import {PriceFeed} from "../typechain/PriceFeed";
import {ContractInterface, ethers, Signer} from "ethers";
import {PriceFeed__factory} from "../typechain/factories/PriceFeed__factory";

const { getSignedPrice } = require("../utils/api-connector");

export type PriceDataType = {
    symbols: string[],
    values: number[],
    timestamp: number
}

export type SignedPriceDataType = {
    priceData: PriceDataType,
    signer: string,
    signature: string
}


async function getPriceData(signer:Signer, dataProvider:string, asset?: string) {
    let {priceData, signature} = await getSignedPrice(dataProvider, asset);

    let priceFeed = PriceFeed__factory.connect(ethers.constants.AddressZero, signer);
    let setPriceTx = await priceFeed.populateTransaction.setPrices(priceData, signature);
    
    let setPriceData = setPriceTx.data ? setPriceTx.data.substr(2) : "";

    let clearPriceTx = await priceFeed.populateTransaction.clearPrices(priceData);
    let clearPricePrefix = clearPriceTx.data ? clearPriceTx.data.substr(2,8) : "";

    //Add priceDataLen info
    let priceDataLen = setPriceData.length/2;
    console.log("Price data len: " + priceDataLen);

    return clearPricePrefix + setPriceData + priceDataLen.toString(16).padStart(4, "0");
}

function getMarkerData() {
    let marker = ethers.utils.id("Redstone.version.0.0.1");
    //console.log("Marker: " + marker);
    return marker.substr(2);
}


export function wrapContract(contract: any, dataProvider: string = "MOCK", asset?: string) {

  const wrappedContract = {...contract};

  const functionNames:string[] = Object.keys(contract.functions);
    functionNames.forEach(functionName => {
    if (functionName.indexOf("(") == -1) {
      const isCall = contract.interface.getFunction(functionName).constant;
      wrappedContract[functionName] = async function(...args: any[]) {

        const tx = await contract.populateTransaction[functionName](...args);

        tx.data = tx.data + (await getPriceData(contract.signer, dataProvider, asset)) + getMarkerData();

        if (isCall) {
            const result = await contract.signer.call(tx);
            const decoded =  contract.interface.decodeFunctionResult(functionName, result);
            return decoded.length == 1 ? decoded[0] : decoded;
        } else {
            return await contract.signer.sendTransaction(tx);
        }
      };
    }
  });

  return wrappedContract;
}
