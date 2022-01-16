import { timeout } from "promise-timeout";

export type SourceType = "cache-layer" | "streamr" | "streamr-storage";

export interface SignedDataPackageResponse {
  timestamp: number;
  prices: { symbol: string; value: any }[];
  signature: string;
  liteSignature: string;
}

export interface SourceConfig {
  type: SourceType;
  url?: string; // required for "cache-layer" sources
  providerId?: string; // required for "cache-layer" sources (it's and Arweave address of provider)
  streamrEndpointPrefix?: string; // required for "streamr" and "streamr-historical" sources
  disabledForSinglePrices?: boolean;
}

export abstract class Fetcher {
  constructor(protected config: SourceConfig, protected asset?: string) {}

  // By default it doesn't do anything
  // But for e.g. streamr fetchers it can subscribe to a stream
  init(): void {}

  abstract getLatestData(): Promise<SignedDataPackageResponse>;

  async getLatestDataWithTimeout(
    timeoutMs: number,
  ): Promise<SignedDataPackageResponse> {
    return await timeout(this.getLatestData(), timeoutMs);
  }
}
