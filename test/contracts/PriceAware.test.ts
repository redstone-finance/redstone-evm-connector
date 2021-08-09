import { ethers } from "hardhat";
import { Wallet } from "ethers";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { MockDefi } from "../../typechain/MockDefi";
import { MockPriceAware } from "../../typechain/MockPriceAware";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {PriceVerifier} from "../../typechain/PriceVerifier";
import {PriceFeed} from "../../typechain/PriceFeed";
const { wrapContract } = require("../../utils/contract-wrapper");

chai.use(solidity);
const { expect } = chai;

const toBytes32 = ethers.utils.formatBytes32String;

describe("Price Aware", function () {
    let owner:SignerWithAddress;
    let signer:Wallet;

    let pa: MockPriceAware;
    let priceFeed: PriceFeed;
    let verifier: PriceVerifier;

    const PRIV = "0xae2b81c1fe9e3b01f060362f03abd0c80a6447cfe00ff7fc7fcf000000000000";

    it("should deploy contracts", async function () {
        [owner] = await ethers.getSigners();

        const PriceFeed = await ethers.getContractFactory("PriceFeed");
        const Verifier = await ethers.getContractFactory("PriceVerifier");

        //verifier = (await Verifier.deploy()) as PriceVerifier;
        //priceFeed = (await PriceFeed.deploy(5 * 60)) as PriceFeed;
        signer = new ethers.Wallet(PRIV, owner.provider);
        
        const MockPriceAware = await ethers.getContractFactory("MockPriceAware");
        pa = (await MockPriceAware.deploy(5 * 60)) as MockPriceAware;
        await pa.authorizeSigner(signer.address);
    });

    it("should get price", async function () {
        await pa.execute(1);

        pa = wrapContract(pa);
        await pa.executeWithPrice(7);
        //await pa.executePriceAware(1);
        //expect(price).to.be.equal(1000000001);
    });




});
