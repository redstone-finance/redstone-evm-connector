import { ethers } from "ethers";
import web3Abi from "web3-eth-abi";

export async function prepareMetaTx(signer: ethers.Signer, contract: ethers.Contract, funAbi: any, args: any) {
  // let name = await contract.name(); // TODO: check
  let name = "RedStone VRF proxy";
  const address = await signer.getAddress();
  let nonce = await contract.getNonce(address);
  let version = "1";
  let chainId = await contract.getChainId();
  let domainData = {
    name: name,
    version: version,
    verifyingContract: contract.address,
    salt: '0x' + chainId.toHexString().substring(2).padStart(64, '0'),
  };

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

  // const dataToSign = {
  //   types: {
  //     EIP712Domain: domainType,
  //     MetaTransaction: metaTransactionType,
  //   },
  //   domain: domainData,
  //   primaryType: "MetaTransaction",
  //   message: message,
  // };

  // const signature = sigUtil.signTypedData(ethUtils.toBuffer(user.privateKey), {
  //   data: dataToSign,
  // });

  const types = getTypes();

  const signature = await signer._signTypedData(domainData, types, message);

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
  const domainType = [
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
  
  const metaTransactionType = [
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

  return {
    MetaTransaction: metaTransactionType,
    // EIP712Domain: domainType,
  };
}
