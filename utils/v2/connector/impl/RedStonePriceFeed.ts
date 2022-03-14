import redstone from "redstone-api-extended";
import {
  DataFeedId,
  DataSourcesConfig,
  SignedPriceDataType,
} from "redstone-api-extended/lib/oracle/redstone-data-feed";
import { PriceFeedConnector } from "../PriceFeedConnector";

export interface DataFeedOptions {
  dataSources?: DataSourcesConfig;
  asset?: string;
};

export class RedStonePriceFeed implements PriceFeedConnector {

  constructor(
    dataFeedId: string,
    private dataFeedOptions: DataFeedOptions = {}) {
      // Getting default data sources config for provider if not specified
      if (!this.dataFeedOptions.dataSources) {
        this.dataFeedOptions.dataSources =
          redstone.oracle.getDefaultDataSourcesConfig(dataFeedId as DataFeedId);
      }
  }

  // This is the entrypoint function of this module
  async getSignedPrice(): Promise<SignedPriceDataType> {
    return await redstone.oracle.get(
      this.dataFeedOptions.dataSources!,
      this.dataFeedOptions.asset);
  }

  getDefaultSigner(): string {
    return this.dataFeedOptions.dataSources!.sources[0].evmSignerAddress;
  }
}
