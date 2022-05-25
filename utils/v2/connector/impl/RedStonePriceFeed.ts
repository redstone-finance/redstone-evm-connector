import redstone from "redstone-api-extended";
import {
  DataFeedId,
  DataSourcesConfig,
  SignedPriceDataType,
} from "redstone-api-extended/lib/oracle/redstone-data-feed";
import { PriceFeedConnector } from "../PriceFeedConnector";

export interface PriceFeedOptions {
  dataSources?: DataSourcesConfig;
  asset?: string;
};

export class RedStonePriceFeed implements PriceFeedConnector {

  constructor(
    dataFeedId: string,
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
      this.priceFeedOptions.asset
    );
  }

  // This is the entrypoint function of this module for multiple prices

  // Example return: {
    //   priceData: {
    //     symbols: [
    //       '0x4554480000000000000000000000000000000000000000000000000000000000',
    //       '0x4554480000000000000000000000000000000000000000000000000000000000',
    //       '0x4554480000000000000000000000000000000000000000000000000000000000',
    //       '0x4554480000000000000000000000000000000000000000000000000000000000',
    //       '0x4554480000000000000000000000000000000000000000000000000000000000'
    //     ],
    //     values: [ 197238281000, 197102700000, 197035667100, 196963838999, 197270551152 ],
    //     timestamp: 1653389250174
    //   },
    //   signature: "",
    //   liteSignature: '0x85b905a3cfe51cd38e19778246e15754313407d0fd9f0d25a79d029531ce67b5217908e2f095b1400b434326142fbc3570be1e7a1a57b5812a61832dad6aac0c1c'
    // }
  async getSignedMultiplePrices(): Promise<SignedPriceDataType> {
    return await (redstone.oracle as any).getMultiple(
      this.priceFeedOptions.dataSources!,
      this.priceFeedOptions.asset
    ); 
  }

  getDefaultSigner(): string {
    return this.priceFeedOptions.dataSources!.sources[0].evmSignerAddress;
  }
}
