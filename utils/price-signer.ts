import { toBuffer } from 'ethereumjs-util';
import { signTypedMessage } from "eth-sig-util";


const PriceData = [
  {name: 'symbols', type: 'bytes32[]'},
  {name: 'prices', type: 'uint256[]'},
  {name: 'timestamp', type: 'uint256'},
  {name: 'signer', type: 'address'},
];


const EIP712Domain = [
  {name: 'name', type: 'string'},
  {name: 'version', type: 'string'},
  {name: 'chainId', type: 'uint256'}
];


function toMessage(priceData:any): any {
  const serializeBN = (value:any) => value.toString();

  return {
    symbols: priceData.symbols,
    prices: priceData.prices.map(serializeBN),
    timestamp: serializeBN(priceData.timestamp),
    signer: priceData.signer
  }
}

export function signPriceData(priceData: any, primaryKey: string):string {

  const domainData =  {
    name: 'Redstone',
    version: '1.0.0',
    chainId : 7,
  };

  const data:any = {
    types: {
      EIP712Domain,
      PriceData: PriceData,
    },
    domain: domainData,
    primaryType: 'PriceData',
    message: toMessage(priceData),
  };

  const privateKey = toBuffer(primaryKey);
  return signTypedMessage(privateKey, {data}, 'V4');
}
