import {PriceFeedConnector, SignedPriceDataType} from "../PriceFeedConnector";
import axios from "axios";
import EvmPriceSigner from "redstone-node/dist/src/utils/EvmPriceSigner";
import _ from "lodash";
import {PriceDataType} from "../../../contract-wrapper";

export type RedStoneProvider = "redstone" | "redstone-stocks" | "redstone-rapid";

export class RedStoneApiConnector implements PriceFeedConnector {

  private readonly baseUrl: string;
  private readonly priceSigner = new EvmPriceSigner();

  constructor(private readonly providerId: RedStoneProvider) {
    this.baseUrl = `https://api.redstone.finance/packages/latest?provider=${providerId}`;
  }

  async getSignedPrice(asset?: string): Promise<SignedPriceDataType> {
    // note: currently only redstone-stocks provider adds EVM signature to each price separately.
    // the other providers are adding signature only to he whole price package.
    if (asset && this.providerId !== "redstone-stocks") {
      throw new Error("Signing single price is currently available only for the redstone-stocks provider");
    }

    const query = this.buildQuery(asset);
    const response = await axios.get(query);

    const pricePackage = _.pick(response.data, ["prices", "timestamp"]);
    const serialized = this.priceSigner.serializeToMessage(pricePackage);

    // TODO: change return type of the priceSigner.serializeToMessage?
    // in the end, we're using TYPEScript here ;-)
    const priceData: PriceDataType = serialized as PriceDataType;

    return {
      priceData,
      ..._.pick(response.data, ["signer", "signature"]),
    };
  }

  private buildQuery(asset?: string): string {
    return asset
      ? `${this.baseUrl}&symbol=${asset}`
      : `${this.baseUrl}`;
  }

}
