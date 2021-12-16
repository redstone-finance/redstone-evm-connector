import { PriceFeedConnector, SignedPriceDataType } from "../PriceFeedConnector";
import axios from "axios";
import _ from "lodash";
import { Fetcher, SignedDataPackageResponse, SourceConfig } from "./fetchers/Fetcher";
import { createFetcher } from "./fetchers";
import { convertResponseToPricePackage, selectDataPackage, validateDataPackage } from "./DataPackageUtils";

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

  // TODO: remove
  // private readonly priceSigner = new EvmPriceSigner();
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
    const fulfilledPromisesResults = results.filter(r => r.status === "fulfilled") as
      PromiseFulfilledResult<SignedDataPackageResponse>[];
    const dataPackages = fulfilledPromisesResults.map(r => r.value);
    const validDataPackages = dataPackages.filter(p =>
      validateDataPackage(
        p,
        this.priceFeedOptions,
        this.cachedSigner!,
      )
    );

    if (validDataPackages.length === 0) {
      console.error(results);
      throw new Error(`Failed to load valid data packages`);
    }

    // Selecting the final value
    const finalResponse = selectDataPackage(
      validDataPackages,
      this.priceFeedOptions.dataSources!.valueSelectionAlgorithm);

    return convertResponseToPricePackage(finalResponse, this.cachedSigner!);
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
