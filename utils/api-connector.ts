import EvmPriceSigner from "redstone-node/dist/src/utils/EvmPriceSigner";
import {PriceDataType, SignedPriceDataType} from "./contract-wrapper";
import axios from "axios";
import _ from "lodash";
import {mockPricePackage} from "./mock-price-package";
import {Wallet} from "ethers";

export function getSignedPrice(
  dataProvider: string,
  asset: string
): Promise<SignedPriceDataType> {
  if (dataProvider == "MOCK") {
    return Promise.resolve(getMockPriceData());
  } else {
    return getRedstoneData(dataProvider, asset);
  }
}

export function getMockPriceData(): SignedPriceDataType {
  const currentTime = Math.round(new Date().getTime());

  // TODO: to jako parametr do mockowania
  const pricePackage = mockPricePackage(currentTime);

  const priceSigner = new EvmPriceSigner();
  const PRIV = "0xae2b81c1fe9e3b01f060362f03abd0c80a6447cfe00ff7fc7fcf000000000000";
  const signer: Wallet = new Wallet(PRIV);

  const signedPackage = priceSigner.signPricePackage(pricePackage, signer.privateKey);

  const serializedPackege: PriceDataType = priceSigner.serializeToMessage(pricePackage) as PriceDataType;

  console.log("Signature: " + signedPackage.signature);

  const signedPriceData: SignedPriceDataType = {
    priceData: serializedPackege,
    signer: signedPackage.signer,
    signature: signedPackage.signature
  };

  return signedPriceData;
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


