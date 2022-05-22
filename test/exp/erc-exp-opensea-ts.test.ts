// const sigUtil = require("eth-sig-util");
// const ethUtils = require("ethereumjs-util");

// const { expect } = require("chai");
const { ethers } = require("hardhat");
// const web3Abi = require("web3-eth-abi");

const { WrapperBuilder } = require("../../lib/index");

// const { MockProvider } = require("ethereum-waffle");

// const domainType = [
//   {
//     name: "name",
//     type: "string",
//   },
//   {
//     name: "version",
//     type: "string",
//   },
//   {
//     name: "verifyingContract",
//     type: "address",
//   },
//   {
//     name: "salt",
//     type: "bytes32",
//   },
// ];

// const metaTransactionType = [
//   {
//     name: "nonce",
//     type: "uint256",
//   },
//   {
//     name: "from",
//     type: "address",
//   },
//   {
//     name: "functionSignature",
//     type: "bytes",
//   },
// ];

// let safeTransferFromAbi = {
//   inputs: [
//     {
//       internalType: "address",
//       name: "from",
//       type: "address",
//     },
//     {
//       internalType: "address",
//       name: "to",
//       type: "address",
//     },
//     {
//       internalType: "uint256",
//       name: "tokenId",
//       type: "uint256",
//     },
//   ],
//   name: "safeTransferFrom",
//   outputs: [],
//   stateMutability: "nonpayable",
//   type: "function",
// };

// let setApprovalForAllAbi = {
//   inputs: [
//     {
//       internalType: "address",
//       name: "operator",
//       type: "address",
//     },
//     {
//       internalType: "bool",
//       name: "approved",
//       type: "bool",
//     },
//   ],
//   name: "setApprovalForAll",
//   outputs: [],
//   stateMutability: "nonpayable",
//   type: "function",
// };

// const getTransactionData = async (user, nonce, abi, domainData, params) => {
//   const functionSignature = web3Abi.encodeFunctionCall(abi, params);

//   let message = {};
//   message.nonce = parseInt(nonce);
//   message.from = await user.getAddress();
//   message.functionSignature = functionSignature;

//   const dataToSign = {
//     types: {
//       EIP712Domain: domainType,
//       MetaTransaction: metaTransactionType,
//     },
//     domain: domainData,
//     primaryType: "MetaTransaction",
//     message: message,
//   };
//   console.log(dataToSign);

//   // TODO: remove
//   console.log({priv: user.privateKey});

//   const signature = sigUtil.signTypedData(ethUtils.toBuffer(user.privateKey), {
//     data: dataToSign,
//   });

//   let r = signature.slice(0, 66);
//   let s = "0x".concat(signature.slice(66, 130));
//   let v = "0x".concat(signature.slice(130, 132));
//   v = parseInt(v);
//   if (![27, 28].includes(v)) v += 27;

//   return {
//     r,
//     s,
//     v,
//     functionSignature,
//   };
// };

describe("ERC721MetaTransactionMaticSample", function () {
  let erc721: any;

  before(async () => {
    const ERC721MetaTransactionMaticSample = await ethers.getContractFactory(
      "SampleWithVRF"
    );
    const erc721MetaTransactionMaticSample = await ERC721MetaTransactionMaticSample.deploy(
      "Sample Token",
      "ST"
    );

    erc721 = await erc721MetaTransactionMaticSample.deployed();

  });

  it("setApprovalForAll MetaTransaction Test", async function () {
    // Original
    // const wallet = new MockProvider().createEmptyWallet();

    // My small update (to check if user can send his own meta tx)
    // const wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
    // console.log(wallet);

    // console.log(`Current signer address in contract: ${erc721.signer.address}`);

    // const addressToApprove = new ethers.Wallet.createRandom().address; // any random address

    // let name = await erc721.name();
    // let nonce = await erc721.getNonce(wallet.getAddress());
    // let version = "1";
    // let chainId = await erc721.getChainId();
    // let domainData = {
    //   name: name,
    //   version: version,
    //   verifyingContract: erc721.address,
    //   salt: '0x' + chainId.toHexString().substring(2).padStart(64, '0'),
    // };

    // // Here we preare the actual tx data to sign
    // let { r, s, v, functionSignature } = await getTransactionData(
    //   wallet,
    //   nonce,
    //   setApprovalForAllAbi,
    //   domainData,
    //   [addressToApprove, true]
    // );

    // let user = await wallet.getAddress();

    // expect(
    //   await erc721.isApprovedForAll(user, addressToApprove)
    // ).to.equal(false);

    // Here we send tx
    const wrappedErc = WrapperBuilder
      .wrapWithVRF(erc721)
      .usingVRFNode({
        url: "https://redstone-vrf-oracle-node-1.redstone.finance/vrf-requests",
      });
    // const tx = await wrappedErc.setApprovalForAll(addressToApprove, true);
    // await tx.wait();

    const tx = await wrappedErc.updateLastRandomValue();
    await tx.wait();


    const latestRandomValue = await wrappedErc.lastRandomValue();
    console.log({latestRandomValue: latestRandomValue.toNumber()});

    // const metaTransaction = await erc721.executeMetaTransaction(
    //   user,
    //   functionSignature,
    //   r,
    //   s,
    //   v
    // );

    // const receipt = await metaTransaction.wait();

    // console.log(receipt);

    // expect(
    //   await erc721.isApprovedForAll(user, addressToApprove)
    // ).to.equal(true);
  });
});
