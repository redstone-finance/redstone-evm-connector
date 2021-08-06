import { Wallet } from "ethers";
import EvmPriceSigner from "redstone-node/dist/src/utils/EvmPriceSigner";
import { PricePackage } from "redstone-node/dist/src/types";
import { PriceDataType, SignedPriceDataType } from "./contract-wrapper";
import axios from "axios";
import _ from "lodash";

export function getSignedPrice(
  dataProvider: string,
  asset: string
): Promise<SignedPriceDataType> {
  if (dataProvider == "MOCK") {
    return Promise.resolve(getMockData());
  } else {
    return getRedstoneData(dataProvider, asset);
  }
}

async function getRedstoneData(dataProvider: string, asset: string): Promise<SignedPriceDataType> {
  let query = "https://api.redstone.finance/packages/latest?provider=" + dataProvider;
  if (asset) {
    query += `&symbol=${asset}`;
  }
  const response = await axios.get(query);

  const priceSigner = new EvmPriceSigner();
  const pricePackage = _.pick(response.data, ["prices", "timestamp"]);
  const serialized = priceSigner.serializeToMessage(pricePackage);

  const priceData: PriceDataType = serialized as PriceDataType;

  const signedPriceData: SignedPriceDataType = {
    priceData,
    ..._.pick(response.data, ["signer", "signature"]),
  };
  return signedPriceData;
}

function getMockData(): SignedPriceDataType {
  const currentTime = Math.round(new Date().getTime());

  const pricePackage: PricePackage = {
    prices: [
      {symbol: "ETH", value: 10},
      {symbol: "AVAX", value: 5}
    ],
    timestamp: currentTime - 1000
  };

  const priceSigner = new EvmPriceSigner();
  const PRIV = "0xae2b81c1fe9e3b01f060362f03abd0c80a6447cfe00ff7fc7fcf000000000000";
  const signer: Wallet = new Wallet(PRIV);

  const signedPackage = priceSigner.signPricePackage(pricePackage, signer.privateKey);

  const serializedPackege: PriceDataType = priceSigner.serializeToMessage(pricePackage) as PriceDataType;

  const signedPriceData: SignedPriceDataType = {
    priceData: serializedPackege,
    signer: signedPackage.signer,
    signature: signedPackage.signature
  };

  return signedPriceData;
}
