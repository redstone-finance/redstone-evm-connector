import {Contract, Signer} from "ethers";
import {MockConnector} from "../connector/impl/MockConnector";
import {RedStoneApiConnector, RedStoneProvider} from "../connector/impl/RedStoneApiConnector";
import {EthersContractWrapper} from "./EthersContractWrapper";
import {bufferToHex, keccak256, toBuffer} from "ethereumjs-util";
import {personalSign} from "eth-sig-util";

export class EthersContractWrapperLite<T extends Contract> extends EthersContractWrapper<T> {


  static usingMockPriceFeed<T extends Contract>(baseContract: T) {
    return new EthersContractWrapperLite(baseContract, new MockConnector());
  }

  static usingRedstoneApi<T extends Contract>(baseContract: T, providerId: RedStoneProvider) {
    return new EthersContractWrapperLite(baseContract, new RedStoneApiConnector(providerId))
  }


  protected getMarkerData() {
    return "";
  }

  protected async getPriceData(signer: Signer, asset?: string) {
    const {priceData} = await this.apiConnector.getSignedPrice(asset)

    let data = "";
    for (let i = 0; i < priceData.symbols.length; i++) {
      data += priceData.symbols[i].substr(2) + priceData.values[i].toString(16).padStart(64, "0");
    }

    data += Math.ceil(priceData.timestamp / 1000).toString(16).padStart(64, "0");
    const hash = bufferToHex(keccak256(toBuffer("0x" + data)));
    const signature = personalSign(toBuffer(MockConnector.P_KEY), {data: hash});
    data += priceData.symbols.length.toString(8).padStart(2, "0")
      + signature.substr(2);

    return data;
  }

}
