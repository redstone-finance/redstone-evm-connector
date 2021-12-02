import {PriceDataType, PriceFeedConnector, SignedPriceDataType} from "../PriceFeedConnector";
import axios from "axios";
import _ from "lodash";
import EvmPriceSigner from "redstone-node/dist/src/signers/EvmPriceSigner";
import StreamrClient from "streamr-client";
import { timeout } from "promise-timeout";

const DEFAULT_TIMEOUT_MILLISECONDS = 10000; // 10 seconds

export type ValueSelectionAlgorithm = "newest-valid" | "oldest-valid"; // wa can add "median-valid" in future
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
      // TODO: move timeout logic to the `fetchFromSource` method
      const timeoutMilliseconds =
        this.priceFeedOptions.dataSources?.timeoutMilliseconds || DEFAULT_TIMEOUT_MILLISECONDS;
      console.log(
        `Fetching data from source "${source.type}" with timeout: ${timeoutMilliseconds} ms`);
      const fetchPromise = timeout(this.fetchFromSource(source), timeoutMilliseconds);
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
    const finalResponse = this.selectResultDataPackage(validDataPackages);

    return this.convertResponseToPricePackage(finalResponse);
  }

  // TODO: improve the implementation
  private selectResultDataPackage(packages: SignedDataPackageResponse[]): SignedDataPackageResponse {
    const { valueSelectionAlgorithm } = this.priceFeedOptions.dataSources!;
    switch (valueSelectionAlgorithm) {
      case "newest-valid": {
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

  private filterValidDataPackages(
    fetchedPackages: PromiseSettledResult<SignedDataPackageResponse>[],
  ): SignedDataPackageResponse[] {

    const result: SignedDataPackageResponse[] = [];
    const maxTimestampDiffMilliseconds =
      this.priceFeedOptions.dataSources?.maxTimestampDiffMilliseconds;
    let sourceIndex = 0;

    for (const fetchedPackage of fetchedPackages) {
      // Checking promise status
      if (fetchedPackage.status === "fulfilled") {

        // Checking timestamp diff
        const timeDiffMilliseconds =
          Date.now() - fetchedPackage.value.timestamp;
        if (maxTimestampDiffMilliseconds && maxTimestampDiffMilliseconds < timeDiffMilliseconds) {
          console.warn(
            `Timestamp is too old: ${fetchedPackage.value.timestamp}. `
            + `Source index: ${sourceIndex}`);
        } else {


          // TODO: move signature verification to a separate function

          // Verifying signature off-chain if needed
          if (this.priceFeedOptions.dataSources?.preVerifySignatureOffchain) {
            // Signature verification
            // Currently only lite signature verification is implemented

            const isValidSignature = this.priceSigner.verifyLiteSignature({
              pricePackage: {
                prices: fetchedPackage.value.prices,
                timestamp: fetchedPackage.value.timestamp,
              },
              signer: this.cachedSigner!,
              signature: fetchedPackage.value.signature,
              liteSignature: fetchedPackage.value.liteSignature,
            });

            if (isValidSignature) {
              result.push(fetchedPackage.value);
            }
          } else {
            // Skipping signature verification
            result.push(fetchedPackage.value);
          }
          
        }
      }

      sourceIndex++;
    }

    return result;
  }

  async fetchFromSource(source: SourceConfig): Promise<SignedDataPackageResponse> {
    switch (source.type) {
      case "cache-layer":
        const url = `${source.url}/packages/latest`;
        const response = await axios.get(url, {
          params: {
            provider: this.providerId,
            symbol: this.priceFeedOptions.asset, // asset may be undefined, then we'll fetch the whole package
          },
        });
        return response.data;
      case "streamr":
        const lastResponse = this.latestValueFromStreamr;
        if (this.priceFeedOptions.asset) {
          const assetData = lastResponse.find(
            ({ symbol }: any) => symbol === this.priceFeedOptions.asset);
          if (!assetData) {
            throw new Error(
              `Data not found for symbol: ${this.priceFeedOptions.asset}`);
          }
          return {
            timestamp: assetData.timestamp,
            prices: [_.pick(assetData, ["symbol", "value"])],
            signature: lastResponse.evmSignature,
            liteSignature: lastResponse.liteEvmSignature,
          };
        } else {
          return {
            timestamp: lastResponse.pricePackage.timestamp,
            signature: lastResponse.signature,
            liteSignature: lastResponse.liteSignature,
            prices: lastResponse.pricePackage.prices,
          };
        }
      case "streamr-historical":
        throw "streamr-historical source is not implemented";
      default:
        throw new Error(`Unsupported data source type: "${source.type}"`);
    }
  }

  private convertResponseToPricePackage(data: SignedDataPackageResponse): SignedPriceDataType {
    const pricePackage = _.pick(data, ["prices", "timestamp"]);
    const serialized = this.priceSigner.serializeToMessage(pricePackage);
    const priceData: PriceDataType = serialized as PriceDataType;
    return {
      priceData,
      signature: data.signature,
      liteSignature: data.liteSignature,
      signer: this.cachedSigner!,
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
              console.log(`Received new value from: ${streamId}`);
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
