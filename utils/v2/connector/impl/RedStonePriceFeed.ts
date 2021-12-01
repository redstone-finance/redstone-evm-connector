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

export interface SignedDataPackageResponse {
  timestamp: number;
  prices: { symbol: string; value: any }[];
  signature: string;
  liteSignature: string;
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
      this.getSigner(); // we are loading signer public key in advance
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
    // We need to get signer public key firstly
    // It will be used to pre-verify signatures off-chain
    await this.getSigner();

    // Fetching data simultaneously
    const promises = [];
    for (const source of this.priceFeedOptions.dataSources!.sources!) {
      const fetchPromise = this.fetchFromSource(source);
      promises.push(fetchPromise);
    }
    const results = await Promise.allSettled(promises);

    // Validating fetched data
    const validDataPackages = this.filterValidDataPackages(results);
    if (validDataPackages.length === 0) {
      console.error(results);
      throw new Error(`Failed to load valid data packages`);
    }

    // Selecting the final value
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

    console.log("========================================================");
    console.log(JSON.stringify(fetchedPackages, null, 2));
    console.log("========================================================");

    const result: SignedPriceDataType[] = [];
    for (const fetchedPackage of fetchedPackages) {
      if (fetchedPackage.status === "fulfilled") {
        // TODO: verify signature and timestamp delay here
        result.push(fetchedPackage.value);
      }
    }
    return result;
  }

  async fetchFromSource(source: SourceConfig): Promise<SignedPriceDataType> {
    switch (source.type) {
      case "cache-layer":
        const url = `${source.url}/packages/latest`;
        const response = await axios.get(url, {
          params: {
            provider: this.providerId,
            symbol: this.priceFeedOptions.asset, // asset may be undefined, then we'll fetch the whole package
          },
        });
        return this.convertResponseToPricePackage(response.data);
      case "streamr":
        let responseData: SignedDataPackageResponse;
        const lastResponse = this.latestValueFromStreamr;
        if (this.priceFeedOptions.asset) {
          // console.log({ latestValueFromStreamr: lastResponse });
          throw "Not implemented - streamr single asset";
        } else {
          responseData = {
            timestamp: lastResponse.pricePackage.timestamp,
            signature: lastResponse.signature,
            liteSignature: lastResponse.liteSignature,
            prices: lastResponse.pricePackage.prices,
          };
        }
        return this.convertResponseToPricePackage(responseData);
      case "streamr-historical":
        // const data = this.streamrClient?.resend({
        //   stream: source.streamrEndpointPrefix,
        //   resend: { last: 1 },
        // }, )
        throw "Not implemented - historical";
        return {} as any;
      default:
        throw new Error(`Unsupported data source type: "${source.type}"`);
    }

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

  private convertResponseToPricePackage(data: SignedDataPackageResponse): SignedPriceDataType {
    const pricePackage = _.pick(data, ["prices", "timestamp"]);
    const serialized = this.priceSigner.serializeToMessage(pricePackage);
    const priceData: PriceDataType = serialized as PriceDataType;
    return {
      priceData,
      signature: data.signature,
      liteSignature: data.liteSignature,
      signer: this.cachedSigner!, // TODO: force signer loading before
    };
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
      console.log({ source });
      if (source.type === "streamr") {
        this.lazyInitializeStreamrClient();

        // TODO: maybe refactor this code
        // Because subscribing logic is very similar

        // Subscribe to a single assets stream
        if (this.priceFeedOptions.asset && !source.disabledForSinglePrices) {
          const streamId = `${source.streamrEndpointPrefix}/prices`;
          this.streamrClient!.subscribe(
            streamId,
            (value: any) => {
              console.log(`Received new value from: ${streamId}`);
              this.latestValueFromStreamr = value;
            });
          console.log(`Subscribed to streamr: ${streamId}`);
        }

        // Subscribe to a package stream
        if (!this.priceFeedOptions.asset) {
          const streamId = `${source.streamrEndpointPrefix}/package`;
          this.streamrClient!.subscribe(
            streamId,
            (value: any) => {
              console.log(`Received new value from: ${streamId}`, value); // TODO: remove value
              this.latestValueFromStreamr = value;
            });
          console.log(`Subscribed to streamr: ${streamId}`);
        }
      }
    }
  }

}

function getDefaultDataSourceConfig(providerId: RedStoneProvider): DataSourcesConfig {
  return require(`./default-data-sources/${providerId}.json`);
}
