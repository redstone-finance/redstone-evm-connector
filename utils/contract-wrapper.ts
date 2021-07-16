import { ethers, Signer } from "ethers";
import { PriceFeed__factory } from "../typechain/factories/PriceFeed__factory";

// TODO: Alex, refactor this file and add many comments to make it understandable

const { getSignedPrice } = require("../utils/api-connector");

export type PriceDataType = {
    symbols: string[],
    values: number[],
    timestamp: number
};

export type SignedPriceDataType = {
    priceData: PriceDataType,
    signer: string,
    signature: string
};

async function getPriceData(signer: Signer, dataProvider: string, asset?: string) {
    let { priceData, signature } = await getSignedPrice(dataProvider, asset);

    let priceFeed = PriceFeed__factory.connect(ethers.constants.AddressZero, signer);
    let setPriceTx = await priceFeed.populateTransaction.setPrices(priceData, signature);
    
    const setPriceData = remove0xFromHexString(setPriceTx.data, {
      allowFalsyValues: true,
    });

    let clearPriceTx = await priceFeed.populateTransaction.clearPrices(priceData); // TODO: Alex, priceData may have any value, we don't use it
    let clearPricePrefix = clearPriceTx.data ? clearPriceTx.data.substr(2,8) : ""; // TODO: Alex, we get 4 bytes from 1 to 4 (skipping 0 (0x)) - this is the function signature clearPrices

    // Add priceDataLen info
    const priceDataLen = countBytesInHexString(setPriceData);

    // TODO: Alex, here is the template of data, that are added to the end of tx:
    // [CLEAR_PRICE_FUNCTION_SIGNATURE (4 bytes)] + [SET_PRICE_FUNCTION_WITH_ARGUMENTS (Variable bytes size, 4 bytes for signature + var bytes for arguments. It is callable)] + [SET_PRICE_FUNCTION_WITH_ARGS_BYTE_LENGTH (2 bytes)]
    return clearPricePrefix + setPriceData + priceDataLen.toString(16).padStart(4, "0"); // padStart helpes to always have 2 bytes length for any number
}

export function wrapContract(contract: any, dataProvider: string = "MOCK", asset?: string) {

  const wrappedContract = {...contract};

  const functionNames:string[] = Object.keys(contract.functions);
    functionNames.forEach(functionName => {
    if (functionName.indexOf("(") == -1) {
      const isCall = contract.interface.getFunction(functionName).constant;
      wrappedContract[functionName] = async function(...args: any[]) {

        const tx = await contract.populateTransaction[functionName](...args);

        // TODO: Alex, here is the price data appending (with marker)
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

function getMarkerData() {
  const marker = ethers.utils.id("Redstone.version.0.0.1");
  return remove0xFromHexString(marker);
}

// Note: this function assumes that hexString doesn't start with 0x
function countBytesInHexString(hexStringWithout0x: string) {
  // 2 hex chars (0-f) represent a single byte
  return hexStringWithout0x.length / 2;
}

function remove0xFromHexString(hexString?: string, opts?: {
  allowFalsyValues: boolean;
}) {
  if (!hexString) {
    if (opts?.allowFalsyValues) {
      return "";
    } else {
      throw new Error("Falsy values are not allowed");
    }
  }

  if (!hexString.toLowerCase().startsWith("0x")) {
    throw new Error(`Hex string must start from 0x: ${hexString}`);
  }

  return hexString.substr(2);
}
