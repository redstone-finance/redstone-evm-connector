import axios from "axios";
import { Fetcher, SignedDataPackageResponse, SourceConfig } from "./Fetcher";

export class CacheLayerFetcher extends Fetcher {

  async getLatestData(providerId: string): Promise<SignedDataPackageResponse> {
    const response = await axios.get(`${this.config.url!}/packages/latest`, {
      params: {
        asset: this.asset,
        provider: providerId,
      },
    });
    return response.data;
  }
}
