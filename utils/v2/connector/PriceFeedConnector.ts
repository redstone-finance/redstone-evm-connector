// TODO: aren't those type available in the redstone-node lib?
import {MockPricePackage} from "./impl/MockPriceFeed";

export interface PriceDataType {
  symbols: string[];
  values: number[];
  timestamp: number;
}

export interface SignedPriceDataType {
  priceData: PriceDataType;
  signature: string;
  liteSignature: string;
}

export interface PriceFeedConnector {
  getSignedPrice(): Promise<SignedPriceDataType>;
  getDefaultSigner(): string;
}

export interface MockablePriceFeedConnector extends PriceFeedConnector {
  mock(value: MockPricePackage): void;
}
