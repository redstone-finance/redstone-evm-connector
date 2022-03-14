import {Contract, Signer} from "ethers";
import {EthersContractWrapper} from "./EthersContractWrapper";
import EvmPriceSigner from "redstone-node/dist/src/signers/EvmPriceSigner";

export class EthersContractWrapperLite<T extends Contract> extends EthersContractWrapper<T> {

  private readonly priceSigner = new EvmPriceSigner();

  protected getMarkerData(): string {
    return "";
  }

  protected async getPriceData(signer: Signer, asset?: string): Promise<string> {
    const {priceData, liteSignature} = await this.apiConnector.getSignedPrice();

    let data = this.priceSigner.getLiteDataBytesString(priceData);
    
    data += priceData.symbols.length.toString(16).padStart(2, "0")
          + liteSignature.substr(2);
    return data;
  }

}
