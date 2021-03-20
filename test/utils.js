const {toBuffer} = require('ethereumjs-util')



const PriceData = [
  //{name: 'symbol', type: 'string'},
  {name: 'prices', type: 'uint256[]'},
  {name: 'timestamp', type: 'uint256'},
  {name: 'signer', type: 'address'},
];


const EIP712Domain = [
  {name: 'name', type: 'string'},
  {name: 'version', type: 'string'},
  {name: 'chainId', type: 'uint256'}
]




function toMessage(priceData) {
  const serializeBN = (value) => value.toString()

  return {
    prices: priceData.prices.map(serializeBN),
    timestamp: serializeBN(priceData.timestamp),
    signer: priceData.signer
  }
}

const Signer = require('eth-sig-util');

function signPriceData(priceData, PK) {

  domainData =  {
    name: 'Limestone',
    version: '1.0.0',
    chainId : 1,
  };

  const data = {
    types: {
      EIP712Domain,
      PriceData: PriceData,
    },
    domain: domainData,
    primaryType: 'PriceData',
    message: toMessage(priceData),
  };

  const privateKey = toBuffer(PK);
  return Signer.signTypedMessage(privateKey, {data}, 'V4');
}

module.exports.signPriceData = signPriceData;
