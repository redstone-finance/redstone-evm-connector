import StreamrClient from "streamr-client";
import _ from "lodash";
import { Fetcher, SignedDataPackageResponse, SourceConfig } from "./Fetcher";

export class StreamrFetcher extends Fetcher {
  private lastValue?: SignedDataPackageResponse;
  private streamrClient: StreamrClient;

  constructor(config: SourceConfig, asset?: string) {
    super(config, asset);
    this.streamrClient = new StreamrClient({
      auth: {
        privateKey: StreamrClient.generateEthereumAccount().privateKey,
      },
    });
  }

  init() {
    const streamId = this.getStreamId();
    this.streamrClient.subscribe(
      streamId,
      (value: any) => {
        console.log(`Received new value from: ${streamId}`);
        this.lastValue = this.extractPriceValue(value);
      });
    console.log(`Subscribed to streamr: ${streamId}`);
  }

  async getLatestData(): Promise<SignedDataPackageResponse> {
    if (!this.lastValue) {
      throw new Error("No data received from stream yet");
    }
    return this.lastValue;
  }

  private getStreamId() {
    return `${this.config.streamrEndpointPrefix!}/`
      + (this.asset ? "prices" : "package");
  }

  private extractPriceValue(receivedValue: any): SignedDataPackageResponse {
    if (this.asset) {
      const assetsArray: any[] = Object.values(receivedValue);
      const assetData = assetsArray.find(
        ({ symbol }: any) => symbol === this.asset);
      if (!assetData) {
        throw new Error(
          `Data not found for symbol: ${this.asset}`);
      }
      return {
        timestamp: assetData.timestamp,
        prices: [_.pick(assetData, ["symbol", "value"])],
        signature: assetData.evmSignature,
        liteSignature: assetData.liteEvmSignature,
      };
    } else {
      return {
        timestamp: receivedValue.pricePackage.timestamp,
        signature: receivedValue.signature,
        liteSignature: receivedValue.liteSignature,
        prices: receivedValue.pricePackage.prices,
      };
    }
  }
}
