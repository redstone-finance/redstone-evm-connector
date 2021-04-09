import {PriceFeed} from "../typechain/PriceFeed";
import {ethers} from "ethers";

const { getSignedPrice } = require("../utils/mock-api");


async function getPriceData(priceFeed: PriceFeed) {
    let {priceData, signature} = getSignedPrice();

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
    let marker = ethers.utils.id("Limestone.version.0.0.1");
    //console.log("Marker: " + marker);
    return marker.substr(2);
}


export function wrapContract(contract: any, priceFeed: PriceFeed) {

  let functionNames:string[] = Object.keys(contract.functions);
    functionNames.forEach(functionName => {
    if (functionName.indexOf("(") == -1) {
      let isCall = contract.interface.getFunction(functionName).constant;
      contract[functionName + "WithPrices"] = async function(...args: any[]) {

        let tx = await contract.populateTransaction[functionName](...args);

        tx.data = tx.data + (await getPriceData(priceFeed)) + getMarkerData();

        if (isCall) {
            let result = await contract.signer.call(tx);
            let decoded =  contract.interface.decodeFunctionResult(functionName, result);
            return decoded.length == 1 ? decoded[0] : decoded;
        } else {
            await contract.signer.sendTransaction(tx);
        }
      };
    }
  });

  return contract;
}
