import { toBuffer } from 'ethereumjs-util';
import { signTypedMessage, recoverTypedMessage, MsgParams } from "eth-sig-util";
import {ethers} from "hardhat";


export type PriceDataType = {
    symbols: string[],
    prices: number[],
    timestamp: number
}

export type SignedPriceDataType = {
  priceData: PriceDataType,
  signer: string,  
  signature: string  
}

const PriceData = [
  {name: 'symbols', type: 'bytes32[]'},
  {name: 'prices', type: 'uint256[]'},
  {name: 'timestamp', type: 'uint256'}
];


const EIP712Domain = [
  {name: 'name', type: 'string'},
  {name: 'version', type: 'string'},
  {name: 'chainId', type: 'uint256'}
];


function toMessage(priceData: PriceDataType): any {
  const serializeBN = (value:any) => value.toString();

  return {
    symbols: priceData.symbols,
    prices: priceData.prices.map(serializeBN),
    timestamp: serializeBN(priceData.timestamp)
  }
}

export function signPriceData(priceData: PriceDataType, primaryKey: string): SignedPriceDataType {

  const domainData =  {
    name: 'Redstone',
    version: '1.0.0',
    chainId : 7,
  };

  const data: any = {
    types: {
      EIP712Domain,
      PriceData: PriceData,
    },
    domain: domainData,
    primaryType: 'PriceData',
    message: toMessage(priceData),
  };

  const signer = (new ethers.Wallet(primaryKey)).address;
  const privateKey = toBuffer(primaryKey);
 
  return {
    priceData: priceData,
    signer: signer,  
    signature: signTypedMessage(privateKey, {data}, 'V4')
  };
}

export function verifySignature(signedPriceData: SignedPriceDataType) {
    //Move to constructor
    const domainData =  {
        name: 'Redstone',
        version: '1.0.0',
        chainId : 7,
    };
    
    //Move to function
    const data: any = {
        types: {
            EIP712Domain,
            PriceData: PriceData,
        },
        domain: domainData,
        primaryType: 'PriceData',
        message: toMessage(signedPriceData.priceData),
    };  
    
  const signer = recoverTypedMessage({data: data, sig: signedPriceData.signature});
  
  return signer.toUpperCase() === signedPriceData.signer.toUpperCase();
}


