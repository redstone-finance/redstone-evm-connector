import {Contract} from "ethers";
import { CustomRequestOnDemand, CustomRequestOnDemandOptions } from "../../connector/impl/CustomRequestOnDemand";
import {RedStonePriceFeed, PriceFeedOptions} from "../../connector/impl/RedStonePriceFeed";
import { DataFeedIdExtended } from "../../types";
import {EthersContractWrapper} from "../EthersContractWrapper";
import {EthersContractWrapperLite} from "../EthersContractWrapperLite";

export type WrapperType = "full" | "lite";

export class EthersContractWrapperBuilder<T extends Contract> {
  constructor(
    private readonly baseContract: T,
    private readonly wrapperType: WrapperType,
  ) {}

  usingPriceFeed(dataFeedId: DataFeedIdExtended, opts: PriceFeedOptions = {}): T {
    const priceFeedConnector = new RedStonePriceFeed(dataFeedId, opts);
    return this.wrapperType === "full"
      ? new EthersContractWrapper(this.baseContract, priceFeedConnector).finish()
      : new EthersContractWrapperLite(this.baseContract, priceFeedConnector).finish();
  }

  usingCustomRequestsOnDemand(opts: CustomRequestOnDemandOptions): T {
    // We don't even handle case with non-lite wrapper, because we don't support
    // non-lite signatures anymore
    const dataConnector = new CustomRequestOnDemand(opts);
    return new EthersContractWrapperLite(this.baseContract, dataConnector).finish();
  }
}
