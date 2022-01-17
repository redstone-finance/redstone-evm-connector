import { PriceFeedConnector, SignedPriceDataType } from "../PriceFeedConnector";
import bluebird from "bluebird";
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
  defaultSignerEvmAddress: string;
  sources: SourceConfig[],
};

export interface PriceFeedOptions {
  dataSources?: DataSourcesConfig;
  asset?: string;
};

export type PriceFeedId =
  | "redstone"
  | "redstone-stocks"
  | "redstone-rapid"
  | "redstone-avalanche"
  | "custom";

export class RedStonePriceFeed implements PriceFeedConnector {

  private fetchers: Fetcher[] = [];

  constructor(
    private priceFeedId: PriceFeedId,
    private priceFeedOptions: PriceFeedOptions = {}) {

      // Getting default data sources config for provider if not specified
      if (!this.priceFeedOptions.dataSources) {
        this.priceFeedOptions.dataSources = getDefaultDataSourceConfig(priceFeedId);
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
  }

  // This is the entrypoint function of this module
  async getSignedPrice(): Promise<SignedPriceDataType> {
    const timeoutMilliseconds =
      this.priceFeedOptions.dataSources?.timeoutMilliseconds
      || DEFAULT_TIMEOUT_MILLISECONDS;
    const useFirstValid =
      this.priceFeedOptions.dataSources!.valueSelectionAlgorithm === "first-valid";

    const selectedResponse = useFirstValid
      ? await this.fetchFirstValid(timeoutMilliseconds)
      : await this.fetchAllAndSelectValid(timeoutMilliseconds);

    return convertResponseToPricePackage(selectedResponse);
  }

  getDefaultSigner(): string {
    return this.priceFeedOptions.dataSources!.defaultSignerEvmAddress;
  }

  private async fetchFirstValid(timeoutMilliseconds: number): Promise<SignedDataPackageResponse> {
    let fetcherIndex = 0;
    const promises = this.fetchers.map(fetcher => {
      fetcherIndex++;
      return (async () => {
        const response = await fetcher.getLatestDataWithTimeout(timeoutMilliseconds);
        const expectedSigner = fetcher.getEvmSignerAddress();
        const isValid = validateDataPackage(response, this.priceFeedOptions, expectedSigner);
        if (isValid) {
          return response;
        } else {
          console.warn("Invalid response: " + JSON.stringify(response));
          throw new Error(
            `Received invalid response from fetcher: ${fetcherIndex}/${this.fetchers.length}`);
        }
      })();
    });

    // Returning the reponse from the first resolved promise
    return await bluebird.Promise.any(promises);
  }

  private async fetchAllAndSelectValid(timeoutMilliseconds: number): Promise<SignedDataPackageResponse> {
    // Fetching data from all sources simultaneously with timeout
    const promises = this.fetchers.map(fetcher =>
      fetcher.getLatestDataWithTimeout(timeoutMilliseconds));
    const results = await Promise.allSettled(promises);

    // Validating fetched data
    const validDataPackages = [];
    for (let fetcherIndex = 0; fetcherIndex < this.fetchers.length; fetcherIndex++) {
      const fetcher = this.fetchers[fetcherIndex];
      const fetcherResult = results[fetcherIndex];
      const expectedSigner = fetcher.getEvmSignerAddress();

      if (fetcherResult.status === "fulfilled" ) {
        const dataPackage = fetcherResult.value;
        const isValid = validateDataPackage(
          dataPackage,
          this.priceFeedOptions,
          expectedSigner
        );

        if (isValid) {
          validDataPackages.push(dataPackage);
        }
      }

    }

    // Checking if there are any valid data packages
    if (validDataPackages.length === 0) {
      console.error(results);
      throw new Error(`Failed to load valid data packages`);
    }

    // Selecting the final value
    const selectedResponse = selectDataPackage(
      validDataPackages,
      this.priceFeedOptions.dataSources!.valueSelectionAlgorithm);

    return selectedResponse;
  }
}

function getDefaultDataSourceConfig(priceFeedId: PriceFeedId): DataSourcesConfig {
  try {
    return require(`./default-data-sources/${priceFeedId}.json`);
  } catch {
    throw new Error(
      `Selected price feed doesn't have default data sources config. `
      + `You should proide it for "${priceFeedId}" price feed`);
  }
}
