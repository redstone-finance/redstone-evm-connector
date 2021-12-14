import { Fetcher, SignedDataPackageResponse } from "./Fetcher";

interface StreamrFetcherConfig {

};

export class StreamrFetcher extends Fetcher {
  private cache: { [key: string]: any } = {};

  // init() {
  //   // TODO: subscribe to stream
  // }

  async getLatestData(): Promise<SignedDataPackageResponse> {
    throw 1;
  }
}
