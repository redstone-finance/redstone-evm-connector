import {Contract} from "ethers";
import {MockPriceFeed} from "../connector/impl/MockPriceFeed";
import {RedStonePriceFeed, RedStoneProvider} from "../connector/impl/RedStonePriceFeed";
import {EthersContractWrapper} from "./EthersContractWrapper";

export class EthersContractWrapperBuilder<T extends Contract> {
  constructor(private readonly baseContract: T) {
  }

  usingMockPriceFeed(): T {
    return new EthersContractWrapper(this.baseContract, new MockPriceFeed()).wrap();
  }

  usingRedStonePriceFeed(providerId: RedStoneProvider, asset?: string): T {
    const priceFeedConnector = new RedStonePriceFeed(providerId, asset);
    return new EthersContractWrapper(this.baseContract, priceFeedConnector).wrap(asset);
  }
}

