import { Fetcher, SignedDataPackageResponse } from "./Fetcher";

// interface StreamrFetcherConfig {

// };

export class StreamrStorageFetcher extends Fetcher {
  private cache: { [key: string]: any } = {};

  // init(config: ) {
  //   // TODO: subscribe to stream
  // }

  getLatestData(): Promise<SignedDataPackageResponse> {
    throw 1;
  }
}