import redstone from "redstone-api-extended";
import {
  DataFeedId,
  DataSourcesConfig,
  SignedPriceDataType,
} from "redstone-api-extended/lib/oracle/redstone-data-feed";
import { DataFeedIdExtended } from "../../types";
import { PriceFeedConnector } from "../PriceFeedConnector";

export interface PriceFeedOptions {
  dataSources?: DataSourcesConfig;
  asset?: string;
};

export class RedStonePriceFeed implements PriceFeedConnector {

  constructor(
    dataFeedId: DataFeedIdExtended,
    private priceFeedOptions: PriceFeedOptions = {}) {
      // Getting default data sources config for provider if not specified
      if (!this.priceFeedOptions.dataSources) {
        this.priceFeedOptions.dataSources =
          redstone.oracle.getDefaultDataSourcesConfig(dataFeedId as DataFeedId);
      }
  }

  // This is the entrypoint function of this module
  async getSignedPrice(): Promise<SignedPriceDataType> {
    return await redstone.oracle.get(
      this.priceFeedOptions.dataSources!,
      this.priceFeedOptions.asset);
  }

  getDefaultSigner(): string {
    return this.priceFeedOptions.dataSources!.sources[0].evmSignerAddress;
  }
}
