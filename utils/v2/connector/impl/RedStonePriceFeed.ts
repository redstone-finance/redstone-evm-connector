import { PriceDataType, PriceFeedConnector, SignedPriceDataType } from "../PriceFeedConnector";
import axios from "axios";
import _ from "lodash";
import EvmPriceSigner from "redstone-node/dist/src/signers/EvmPriceSigner";
import { Fetcher, SignedDataPackageResponse, SourceConfig } from "./fetchers/Fetcher";
import { createFetcher } from "./fetchers";

const DEFAULT_TIMEOUT_MILLISECONDS = 10000; // 10 seconds

export type ValueSelectionAlgorithm = "first-valid" | "newest-valid" | "oldest-valid"; // wa can add "median-valid" in future
export type SourceType = "cache-layer" | "streamr" | "streamr-storage";

export interface DataSourcesConfig {
  valueSelectionAlgorithm: ValueSelectionAlgorithm,
  timeoutMilliseconds: number;
  maxTimestampDiffMilliseconds: number;
  preVerifySignatureOffchain: boolean;
  signers?: string[], // Will be used in future (after multi-nodes creation)
  sources: SourceConfig[],
};

export interface PriceFeedOptions {
  dataSources?: DataSourcesConfig;
  asset?: string;
};

export type RedStoneProvider =
  | "redstone"
  | "redstone-stocks"
  | "redstone-rapid"
  | "redstone-avalanche";

export class RedStonePriceFeed implements PriceFeedConnector {

  private readonly priceSigner = new EvmPriceSigner();
  private cachedSigner?: string;
  private fetchers: Fetcher[] = [];

  constructor(
    private providerId: RedStoneProvider,
    private priceFeedOptions: PriceFeedOptions = {}) {

      // Getting default data sources config for provider if not specified
      if (!this.priceFeedOptions.dataSources) {
        this.priceFeedOptions.dataSources = getDefaultDataSourceConfig(providerId);
      }

      // Init fetchers
      for (const [i, source] of this.priceFeedOptions.dataSources!.sources!.entries()) {
        if (priceFeedOptions.asset && source.disabledForSinglePrices) {
          console.log(`Skipping ${i} (${source.type}) source init`);
        } else {
          const fetcherForSource = createFetcher(source, priceFeedOptions.asset);
          this.fetchers.push(fetcherForSource);
        }
      }

      // TODO: get rid of it, it's a potential single point of failure
      this.getSigner(); // we are loading signer public key in advance
  }

  // This is the entrypoint function of this module
  async getSignedPrice(): Promise<SignedPriceDataType> {
    // We need to get signer public key firstly
    // It will be used to pre-verify signatures off-chain
    await this.getSigner();
    
    // Fetching data from all sources simultaneously with timeout
    const timeoutMilliseconds =
      this.priceFeedOptions.dataSources?.timeoutMilliseconds
      || DEFAULT_TIMEOUT_MILLISECONDS;
    const promises = this.fetchers.map(fetcher =>
      fetcher.getLatestDataWithTimeout(this.providerId, timeoutMilliseconds));
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

  private selectResultDataPackage(packages: SignedDataPackageResponse[]): SignedDataPackageResponse {
    const sortedPackages = [...packages];
    sortedPackages.sort((p1, p2) => p1.timestamp - p2.timestamp); // sorting prices from oldest to newest
    const { valueSelectionAlgorithm } = this.priceFeedOptions.dataSources!;
    switch (valueSelectionAlgorithm) {

      // TODO: improve the implementation for first-valid
      case "first-valid":
        return packages[packages.length - 1];

      case "newest-valid":
        return packages[packages.length - 1];

      case "oldest-valid":
        return packages[0];

      default:
        throw new Error(
          `Unsupported value for valueSelectionAlgorithm: ${valueSelectionAlgorithm}`);
    }
  }

  // TODO: refactor this implementation with checker modules
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

  // TODO: get rid of it later
  // It is a potential single point of failure
  async getSigner(): Promise<string> {
    if (!this.cachedSigner) {
      const response = await axios.get("https://api.redstone.finance/providers");
      this.cachedSigner = response.data[this.providerId].evmAddress;
    }
    return this.cachedSigner as string;
  }

}

function getDefaultDataSourceConfig(providerId: RedStoneProvider): DataSourcesConfig {
  return require(`./default-data-sources/${providerId}.json`);
}
