import {MockablePriceFeedConnector, PriceDataType, SignedPriceDataType} from "../PriceFeedConnector";
import {Wallet} from "ethers";
import {PricePackage, SignedPricePackage} from "redstone-node/dist/src/types";
import EvmPriceSigner from "redstone-node/dist/src/signers/EvmPriceSigner";

export type MockPricePackage = (forTime: number) => PricePackage;

export class MockPriceFeed implements MockablePriceFeedConnector {

  static readonly P_KEY = "0xae2b81c1fe9e3b01f060362f03abd0c80a6447cfe00ff7fc7fcf000000000000";

  private readonly priceSigner = new EvmPriceSigner();
  private readonly signer = new Wallet(MockPriceFeed.P_KEY);

  private _mockedPricePackage: MockPricePackage;

  constructor(initialMock: MockPricePackage) {
    this.mock = this.mock.bind(this);
    this._mockedPricePackage = initialMock;
  }

  async getSignedPrice(): Promise<SignedPriceDataType> {
    const currentTime = Math.round(new Date().getTime());
    const pricePackage: PricePackage = this._mockedPricePackage(currentTime);

    const signedPackage: SignedPricePackage = this.priceSigner.signPricePackage(
      pricePackage, this.signer.privateKey);
    const serializedPackage: PriceDataType = this.priceSigner.serializeToMessage(pricePackage) as PriceDataType;

    return {
      priceData: serializedPackage,
      signer: signedPackage.signer,
      signature: signedPackage.signature
    };
  }

  mock(value: MockPricePackage): void {
    this._mockedPricePackage = value;
  }
}
