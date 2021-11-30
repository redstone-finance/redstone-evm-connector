import {PriceDataType, PriceFeedConnector, SignedPriceDataType} from "../PriceFeedConnector";
import axios from "axios";
import _ from "lodash";
import EvmPriceSigner from "redstone-node/dist/src/signers/EvmPriceSigner";
import StreamrClient from "streamr-client";

export type ValueSelectionAlgorithm = "latest-valid" | "oldest-valid"; // wa can add "median-valid" in future
export type SourceType = "cache-layer" | "streamr" | "streamr-historical";

export interface SourceConfig {
  type: SourceType;
  url?: string; // required for "cache-layer" sources
  streamrEndpointPrefix?: string; // required for "streamr" and "streamr-historical" sources
  disabledForSinglePrices: boolean;
};

export interface DataSourcesConfig {
  valueSelectionAlgorithm: ValueSelectionAlgorithm,
  timeoutMilliseconds: number;
  maxTimestampDiffMilliseconds: number;
  preVerifySignatureOffchain: boolean;
  sources: SourceConfig[],
};

export interface PriceFeedOptions {
  dataSources?: DataSourcesConfig;
  asset?: string;
}

export type RedStoneProvider =
  | "redstone"
  | "redstone-stocks"
  | "redstone-rapid"
  | "redstone-avalanche";

export class RedStonePriceFeed implements PriceFeedConnector {

  private readonly priceSigner = new EvmPriceSigner();
  private cachedSigner?: string;
  private streamrClient?: StreamrClient;
  private latestValueFromStreamr: any;

  constructor(
    private providerId: RedStoneProvider,
    private priceFeedOptions: PriceFeedOptions = {}) {

      if (!this.priceFeedOptions.dataSources) {
        this.priceFeedOptions.dataSources = getDefaultDataSourceConfig(providerId);
      }

      this.maybeSubscribeToStreamr();
  }

  private lazyInitializeStreamrClient() {
    if (!this.streamrClient) {
      this.streamrClient = new StreamrClient({
        auth: {
          privateKey: (StreamrClient.generateEthereumAccount()).privateKey,
        },
      });
    }
  }

  async getSignedPrice(): Promise<SignedPriceDataType> {
    // Fetching data simultaneously
    const promises = [];
    for (const source of this.priceFeedOptions.dataSources!.sources!) {
      const fetchPromise = this.fetchFromSource(source);
      promises.push(fetchPromise);
    }
    const results = await Promise.allSettled(promises);

    // Validating fetched data and selecting the final value
    const validDataPackages = this.filterValidDataPackages(results);

    if (validDataPackages.length === 0) {
      console.error(results);
      throw new Error(`Failed to load valid data packages`);
    }

    return this.selectResultDataPackage(validDataPackages);
  }

  // TODO: improve the implementation
  private selectResultDataPackage(packages: SignedPriceDataType[]) {
    const { valueSelectionAlgorithm } = this.priceFeedOptions.dataSources!;
    switch (valueSelectionAlgorithm) {
      case "latest-valid": {
        // TODO: improve the implementation
        return packages[0];
      }
      case "oldest-valid": {
        // TODO: improve the implementation
        return packages[packages.length - 1];
      }
      default: {
        throw new Error(
          `Unsupported value for valueSelectionAlgorithm: ${valueSelectionAlgorithm}`);
      }
    }
  }

  // TODO: implement signature verification
  // TODO: implement timestamp delay verification
  private filterValidDataPackages(fetchedPackages: PromiseSettledResult<SignedPriceDataType>[]): SignedPriceDataType[] {
    const result: SignedPriceDataType[] = [];
    for (const fetchedPackage of fetchedPackages) {
      if (fetchedPackage.status === "fulfilled") {
        // TODO: verify signature and timestamp delay here
        result.push(fetchedPackage.value);
      }
    }
    return result;
  }

  // TODO: implement
  async fetchFromSource(source: SourceConfig): Promise<SignedPriceDataType> {
    throw "TODO: implement";

    // // TODO: fetch from all sources 
    // const response = await axios.get(this.apiUrl);

    // const pricePackage = _.pick(response.data, ["prices", "timestamp"]);
    // const serialized = this.priceSigner.serializeToMessage(pricePackage);

    // // TODO: change return type of the priceSigner.serializeToMessage?
    // // in the end, we're using TYPEScript here ;-)
    // const priceData: PriceDataType = serialized as PriceDataType;

    // return {
    //   priceData,
    //   ..._.pick(response.data, ["signer", "signature", "liteSignature"]),
    // };
  }

  async getSigner(): Promise<string> {
      if (!this.cachedSigner) {
          const response = await axios.get("https://api.redstone.finance/providers");
          this.cachedSigner = response.data[this.providerId].evmAddress;
      }
      return this.cachedSigner as string;
  }

  private maybeSubscribeToStreamr() {
    for (const source of this.priceFeedOptions.dataSources!.sources!) {
      if (source.type === "streamr" || source.type === "streamr-historical") {
        this.lazyInitializeStreamrClient();
        if (source.type == "streamr") {
          // Subscribe to a single assets stream
          if (this.priceFeedOptions.asset && !source.disabledForSinglePrices) {
            this.streamrClient!.subscribe(`${source.streamrEndpointPrefix}/prices`, value => {
              this.latestValueFromStreamr = value;
            });
          }

          // Subscribe to a package stream
          if (!this.priceFeedOptions.asset) {
            this.streamrClient!.subscribe(`${source.streamrEndpointPrefix}/prices`, value => {
              this.latestValueFromStreamr = value;
            });
          }
        }
      }
    }
  }

}

function getDefaultDataSourceConfig(providerId: RedStoneProvider): DataSourcesConfig {
  return require(`./default-data-sources/${providerId}.json`);
}
