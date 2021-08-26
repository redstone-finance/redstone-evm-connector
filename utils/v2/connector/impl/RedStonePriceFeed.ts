import {PriceDataType, PriceFeedConnector, SignedPriceDataType} from "../PriceFeedConnector";
import axios from "axios";
import _ from "lodash";
import EvmPriceSigner from "redstone-node/dist/src/signers/EvmPriceSigner";
import {ethers} from "hardhat";
import {MockPriceFeed} from "./MockPriceFeed";

export type RedStoneProvider = "redstone" | "redstone-stocks" | "redstone-rapid";

export class RedStonePriceFeed implements PriceFeedConnector {

  private readonly priceSigner = new EvmPriceSigner();
  private readonly apiUrl: string;
  private cachedSigner?: string;

  constructor(
    private providerId: RedStoneProvider,
    private asset?: string) {
    // note: currently only redstone-stocks provider adds EVM signature to each price separately.
    // the other providers are adding signature only to he whole price package.
    if (asset && providerId !== "redstone-stocks") {
      throw new Error("Signing single price is currently available only for the redstone-stocks provider");
    }

    this.apiUrl = `https://api.redstone.finance/packages/latest?provider=${providerId}`
      + (asset ? `&symbol=${asset}` : '');
    
  }

  async getSignedPrice(): Promise<SignedPriceDataType> {
    const response = await axios.get(this.apiUrl);

    const pricePackage = _.pick(response.data, ["prices", "timestamp"]);
    const serialized = this.priceSigner.serializeToMessage(pricePackage);

    // TODO: change return type of the priceSigner.serializeToMessage?
    // in the end, we're using TYPEScript here ;-)
    const priceData: PriceDataType = serialized as PriceDataType;

    return {
      priceData,
      ..._.pick(response.data, ["signer", "signature", "liteSignature"]),
    };
  }

  async getSigner(): Promise<string> {
      if (!this.cachedSigner) {
          const response = await axios.get("https://api.redstone.finance/providers");
          this.cachedSigner = response.data[this.providerId].evmAddress;
      }
      return this.cachedSigner as string;
  }

}
