import { CacheLayerFetcher } from "./CacheLayerFetcher";
import { SourceConfig } from "./Fetcher";
import { StreamrFetcher } from "./StreamrFetcher";
import { StreamrStorageFetcher } from "./StreamrStorageFetcher";

export function createFetcher(config: SourceConfig, asset?: string) {
  switch (config.type) {
    case "cache-layer":
      return new CacheLayerFetcher(config.url!, asset);
    case "streamr":
      return new StreamrFetcher(); // TODO: add params
    case "streamr-storage":
      return new StreamrStorageFetcher(); // TODO: add params
    default:
      throw new Error(`Data source type is not supported: ${config.type}`);
  }
}
