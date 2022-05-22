import { ethers } from "ethers";
import web3Abi from "web3-eth-abi";
// import sigUtil from "eth-sig-util";
const ethUtils = require("ethereumjs-util");
const sigUtil = require("eth-sig-util");

export async function prepareMetaTx(signer: ethers.Signer, contract: ethers.Contract, funAbi: any, args: any) {
  // let name = await contract.name(); // TODO: check
  const name = await contract.getContractPublicName();
  const address = await signer.getAddress();
  const nonce = await contract.getNonce(address);
  const version = "1";
  const chainId = await contract.getChainId();
  const domainData = {
    name,
    version,
    verifyingContract: contract.address,
    salt: "0x" + chainId.toHexString().substring(2).padStart(64, '0'),
  };

  console.log({ signerAddress: address });

  // Here we preare the actual tx data to sign
  let { r, s, v, functionSignature } = await getTransactionData(
    signer,
    nonce,
    funAbi,
    domainData,
    args,
  );

  return { r, s, v, functionSignature };
}

// TODO: add types later
const getTransactionData = async (
  signer: any,
  nonce: any,
  abi: any,
  domainData: any,
  params: any[]
) => {
  console.log("getTransactionData", {
    signer, 
    nonce,
    abi,
    domainData,
    params,
  });
  // TODO: check if encodeFunctionCall works
  const functionSignature = (web3Abi as any).encodeFunctionCall(abi, params);
  console.log({ functionSignature }); // TODO: remove

  let message: any = {};
  message.nonce = parseInt(nonce);
  message.from = await signer.getAddress();
  message.functionSignature = functionSignature;


  // Option 1. With ethers.js
  // const types = getTypes();
  // const signature = await signer._signTypedData(domainData, types, message);
  // End of option 1

  // Option 2. With eth-sig-util
  const dataToSign = {
    types: {
      EIP712Domain: getDomainType(),
      MetaTransaction: getMetaTransactionType(),
    },
    domain: domainData,
    primaryType: "MetaTransaction",
    message: message,
  };
  console.log("Data to sign: ", dataToSign);
  const HARDHAT_USER_1_PRIV = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  // const HARDHAT_USER_2_PRIV = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
  const signature = sigUtil.signTypedData(ethUtils.toBuffer(HARDHAT_USER_1_PRIV), {
    data: dataToSign,
  } as any);
  // End of option 2


  let r = signature.slice(0, 66);
  let s = "0x".concat(signature.slice(66, 130));
  let v = parseInt("0x".concat(signature.slice(130, 132)));
  if (![27, 28].includes(v)) v += 27;

  return {
    r,
    s,
    v,
    functionSignature,
  };
};

function getTypes() {

  return {
    MetaTransaction: getMetaTransactionType(),
    // EIP712Domain: getDomainType(),
  };
}

function getMetaTransactionType() {
  return [
    {
      name: "nonce",
      type: "uint256",
    },
    {
      name: "from",
      type: "address",
    },
    {
      name: "functionSignature",
      type: "bytes",
    },
  ];
}

function getDomainType() {
  return [
    {
      name: "name",
      type: "string",
    },
    {
      name: "version",
      type: "string",
    },
    {
      name: "verifyingContract",
      type: "address",
    },
    {
      name: "salt",
      type: "bytes32",
    },
  ];
}