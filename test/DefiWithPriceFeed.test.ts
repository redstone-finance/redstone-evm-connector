import { ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { MockDefi } from "../typechain/MockDefi";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {Wallet} from "ethers";
import {PriceVerifier} from "../typechain/PriceVerifier";
const { wrapContract } = require("../utils/contract-wrapper");

import {PriceFeed} from "../typechain/PriceFeed";
chai.use(solidity);

const { expect } = chai;

describe("MockDefi with Proxy contract but no pricing data", function() {

  const PRIV = "0xae2b81c1fe9e3b01f060362f03abd0c80a6447cfe00f00000000000000000000";


  let owner: SignerWithAddress;
  let admin: SignerWithAddress;
  let defi: MockDefi;
  let priceFeed: PriceFeed;
  let verifier: PriceVerifier;
  let signer: Wallet;

  it("Deployment should have zero balance", async function() {
    [owner, admin] = await ethers.getSigners();

    const Defi = await ethers.getContractFactory("MockDefi");
    const Proxy = await ethers.getContractFactory("ModTransparentUpgradeableProxy");
    const PriceFeed = await ethers.getContractFactory("PriceFeed");
    const Verifier = await ethers.getContractFactory("PriceVerifier");

    signer = new ethers.Wallet(PRIV, owner.provider);

    verifier = (await Verifier.deploy()) as PriceVerifier;
    priceFeed = (await PriceFeed.deploy(verifier.address, 5 * 60)) as PriceFeed;

    defi = (await Defi.deploy(priceFeed.address)) as MockDefi;

    console.log("Defi address: " + defi.address);
    const proxy = await Proxy.deploy(defi.address, admin.address, [], priceFeed.address);

    defi = (await Defi.attach(proxy.address)) as MockDefi;
    defi = defi.connect(signer);

    await owner.sendTransaction({to: signer.address, value: ethers.utils.parseEther("1")});

  });


  it("Should deposit with 1 price data", async function() {

    defi = wrapContract(defi, priceFeed);

    await defi.depositWithPrices(100);

  });

});