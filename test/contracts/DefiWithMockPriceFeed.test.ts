import { ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { MockDefi } from "../../typechain/MockDefi";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {Wallet} from "ethers";
import {PriceVerifier} from "../../typechain/PriceVerifier";
const { wrapContract } = require("../../utils/contract-wrapper");

import {PriceFeed} from "../../typechain/PriceFeed";
chai.use(solidity);

const { expect } = chai;

const toBytes32 = ethers.utils.formatBytes32String;
const serialized = function (x: number): number {
    return x * 10**8;
};

describe("MockDefi with Proxy contract and pricing Data", function() {

  const PRIV = "0xae2b81c1fe9e3b01f060362f03abd0c80a6447cfe00ff7fc7fcf000000000000";


  let owner: SignerWithAddress;
  let admin: SignerWithAddress;
  let defi: MockDefi;
  let priceFeed: PriceFeed;
  let verifier: PriceVerifier;
  let signer: Wallet;

  it("Deployment should have zero balance", async function() {
    [owner, admin] = await ethers.getSigners();

    const Defi = await ethers.getContractFactory("MockDefi");
    const Proxy = await ethers.getContractFactory("RedstoneUpgradeableProxy");
    const PriceFeed = await ethers.getContractFactory("PriceFeed");
    const Verifier = await ethers.getContractFactory("PriceVerifier");

    signer = new ethers.Wallet(PRIV, owner.provider);

    verifier = (await Verifier.deploy()) as PriceVerifier;
    priceFeed = (await PriceFeed.deploy(verifier.address, 5 * 60 * 1000)) as PriceFeed;
    await priceFeed.authorizeSigner(signer.address);

    defi = (await Defi.deploy()) as MockDefi;

    const proxy = await Proxy.deploy(defi.address, priceFeed.address, admin.address, []);

    defi = (await Defi.attach(proxy.address)) as MockDefi;
    await defi.initialize(priceFeed.address);
    
    defi = defi.connect(signer);

    await owner.sendTransaction({to: signer.address, value: ethers.utils.parseEther("1")});

  });


  it("Should deposit - write no pricing info", async function() {

    defi = wrapContract(defi);

    await defi.deposit(toBytes32("ETH"), 100);
    await defi.deposit(toBytes32("AVAX"), 50);

  });


  it("Should check balance - read no pricing info", async function() {

    expect(await defi.balanceOf(signer.address, toBytes32("ETH"))).to.be.equal(100);
    expect(await defi.balanceOf(signer.address, toBytes32("AVAX"))).to.be.equal(50);

  });


  it("Should check value - read with pricing info", async function() {

    expect(await defi.currentValueOf(signer.address, toBytes32("ETH"))).to.be.equal(serialized(1000));
    expect(await defi.currentValueOf(signer.address, toBytes32("AVAX"))).to.be.equal(serialized(250));

  });


  it("Should swap - write with pricing info", async function() {

    let tx = await defi.swap(toBytes32("ETH"), toBytes32("AVAX"), 10);
    expect(tx).is.not.undefined;
    
    expect(await defi.balanceOf(signer.address, toBytes32("ETH"))).to.be.equal(90);
    expect(await defi.balanceOf(signer.address, toBytes32("AVAX"))).to.be.equal(70);

  });

});
