import {Contract} from "ethers";
import {RedStonePriceFeed, RedStoneProvider, PriceFeedOptions} from "../../connector/impl/RedStonePriceFeed";
import {EthersContractWrapper} from "../EthersContractWrapper";
import {EthersContractWrapperLite} from "../EthersContractWrapperLite";

export type WrapperType = "full" | "lite";

export class EthersContractWrapperBuilder<T extends Contract> {
  constructor(
    private readonly baseContract: T,
    private readonly wrapperType: WrapperType,
  ) {}

  usingPriceFeed(providerId: RedStoneProvider, opts: PriceFeedOptions = {}): T {
    const priceFeedConnector = new RedStonePriceFeed(providerId, opts);
    return this.wrapperType === "full"
      ? new EthersContractWrapper(this.baseContract, priceFeedConnector).finish()
      : new EthersContractWrapperLite(this.baseContract, priceFeedConnector).finish();
  }
}
