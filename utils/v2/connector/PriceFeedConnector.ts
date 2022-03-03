import {MockPricePackage} from "./impl/MockPriceFeed";
import {
  SignedPriceDataType,
} from "redstone-api-extended/lib/oracle/redstone-data-feed";

export interface PriceFeedConnector {
  getSignedPrice(): Promise<SignedPriceDataType>;
  getDefaultSigner(): string;
}

export interface MockablePriceFeedConnector extends PriceFeedConnector {
  mock(value: MockPricePackage): void;
}
