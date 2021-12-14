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
  streamrEndpointPrefix?: string; // required for "streamr" and "streamr-historical" sources
  disabledForSinglePrices?: boolean;
}

export abstract class Fetcher {
  constructor() {}

  // By default it doesn't do anything
  // But for e.g. streamr fetchers it can subscribe to a stream
  async init(..._args: any[]): Promise<void> {}

  abstract getLatestData(timeoutMs: number): Promise<SignedDataPackageResponse>;
}
