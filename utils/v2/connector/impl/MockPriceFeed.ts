import {PriceDataType, PriceFeedConnector, SignedPriceDataType} from "../PriceFeedConnector";
import {mockPricePackage} from "../../../mock-price-package";
import {Wallet} from "ethers";
import {SignedPricePackage} from "redstone-node/dist/src/types";
import EvmPriceSigner from "redstone-node/dist/src/signers/EvmPriceSigner";
import {ethers} from "hardhat";


export class MockPriceFeed implements PriceFeedConnector {

  static readonly P_KEY = "0xae2b81c1fe9e3b01f060362f03abd0c80a6447cfe00ff7fc7fcf000000000000";

  private readonly priceSigner = new EvmPriceSigner();
  private readonly signer = new Wallet(MockPriceFeed.P_KEY);

  async getSignedPrice(): Promise<SignedPriceDataType> {
    const currentTime = Math.round(new Date().getTime());
    const pricePackage = mockPricePackage(currentTime);

    const signedPackage: SignedPricePackage = this.priceSigner.signPricePackage(
      pricePackage, this.signer.privateKey);
    const serializedPackage: PriceDataType = this.priceSigner.serializeToMessage(pricePackage) as PriceDataType;

    return {
      priceData: serializedPackage,
      signer: signedPackage.signer,
      signature: signedPackage.signature,
      liteSignature: signedPackage.liteSignature
    };
  }
  
  getSigner(): Promise<string> {
    const wallet = new ethers.Wallet(MockPriceFeed.P_KEY);
    return Promise.resolve(wallet.address);
  }

}
