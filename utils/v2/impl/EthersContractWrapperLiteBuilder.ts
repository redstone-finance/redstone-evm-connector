import {Contract} from "ethers";
import {MockPriceFeed} from "../connector/impl/MockPriceFeed";
import {RedStonePriceFeed, RedStoneProvider} from "../connector/impl/RedStonePriceFeed";
import {EthersContractWrapperLite} from "./EthersContractWrapperLite";

export class EthersContractWrapperLiteBuilder<T extends Contract> {
  constructor(private readonly baseContract: T) {
  }

  usingMockPriceFeed(): T {
    return new EthersContractWrapperLite(this.baseContract, new MockPriceFeed()).wrap();
  }

  usingRedStonePriceFeed(providerId: RedStoneProvider, asset?: string): T {
    const priceFeedConnector = new RedStonePriceFeed(providerId, asset);
    return new EthersContractWrapperLite(this.baseContract, priceFeedConnector).wrap(asset);
  }

}
