import { SignedDataPackageResponse, SourceConfig } from "./Fetcher";
import { StreamrFetcher } from "./StreamrFetcher";

export class StreamrStorageFetcher extends StreamrFetcher {
  constructor(config: SourceConfig, asset?: string) {
    super(config, asset);
  }

  getLatestData(): Promise<SignedDataPackageResponse> {
    const streamId = this.getStreamId();
    return new Promise((resolve) => {

      // Getting data from streamr storage
      this.streamrClient.resend({
        stream: streamId,
        resend: {
          last: 1,
        },
      }, (value: any) => {
        resolve(this.extractPriceValue(value));
      })
    });
  }
}
