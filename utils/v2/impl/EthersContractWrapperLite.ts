import {Contract, Signer} from "ethers";
import {MockPriceFeed} from "../connector/impl/MockPriceFeed";
import {EthersContractWrapper} from "./EthersContractWrapper";
import {bufferToHex, keccak256, toBuffer} from "ethereumjs-util";
import {personalSign} from "eth-sig-util";
import {EthersContractWrapperLiteBuilder} from "./EthersContractWrapperLiteBuilder";

export class EthersContractWrapperLite<T extends Contract> extends EthersContractWrapper<T> {

  static wrapLite<T extends Contract>(contract: T): EthersContractWrapperLiteBuilder<T> {
    return new EthersContractWrapperLiteBuilder(contract);
  }

  protected getMarkerData() {
    return "";
  }

  protected async getPriceData(signer: Signer, asset?: string) {
    const {priceData} = await this.apiConnector.getSignedPrice()

    let data = "";
    for (let i = 0; i < priceData.symbols.length; i++) {
      data += priceData.symbols[i].substr(2) + priceData.values[i].toString(16).padStart(64, "0");
    }

    data += Math.ceil(priceData.timestamp / 1000).toString(16).padStart(64, "0");
    const hash = bufferToHex(keccak256(toBuffer("0x" + data)));
    const signature = personalSign(toBuffer(MockPriceFeed.P_KEY), {data: hash});
    data += priceData.symbols.length.toString(8).padStart(2, "0")
      + signature.substr(2);

    return data;
  }

}
