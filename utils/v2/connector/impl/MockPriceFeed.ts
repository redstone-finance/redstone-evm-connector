import {PriceDataType, PriceFeedConnector, SignedPriceDataType} from "../PriceFeedConnector";
import EvmPriceSigner from "redstone-node/dist/src/utils/EvmPriceSigner";
import {mockPricePackage} from "../../../mock-price-package";
import {Wallet} from "ethers";
import {SignedPricePackage} from "redstone-node/dist/src/types";


export class MockPriceFeed implements PriceFeedConnector {

  static readonly P_KEY = "0xae2b81c1fe9e3b01f060362f03abd0c80a6447cfe00ff7fc7fcf000000000000";

  private readonly priceSigner = new EvmPriceSigner();
  private readonly signer = new Wallet(MockPriceFeed.P_KEY);

  constructor() {
  }


  async getSignedPrice(): Promise<SignedPriceDataType> {
    const currentTime = Math.round(new Date().getTime());
    const pricePackage = mockPricePackage(currentTime);

    const signedPackage: SignedPricePackage = this.priceSigner.signPricePackage(
      pricePackage, this.signer.privateKey);
    const serializedPackage: PriceDataType = this.priceSigner.serializeToMessage(pricePackage) as PriceDataType;

    return {
      priceData: serializedPackage,
      signer: signedPackage.signer,
      signature: signedPackage.signature
    };
  }

}
