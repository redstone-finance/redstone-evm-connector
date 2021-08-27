import {ethers} from "hardhat";
import {Wallet} from "ethers";
import chai from "chai";
import {solidity} from "ethereum-waffle";

import { SampleInlinedPriceAwareAsm } from "../../typechain/SampleInlinedPriceAwareAsm";
import { SamplePriceAwareAsm } from "../../typechain/SamplePriceAwareAsm";
import { SamplePriceAware } from "../../typechain/SamplePriceAware";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {syncTime} from "../_helpers";
import {MockPriceFeed} from "../../utils/v2/connector/impl/MockPriceFeed";
import WrapperBuilder from "../../utils/v2/impl/builder/WrapperBuilder";
import {DEFAULT_PRICE, MockableContract} from "../../utils/v2/impl/builder/MockableEthersContractWrapperBuilder";

chai.use(solidity);

describe("Price Aware - basic version", function () {
    let owner:SignerWithAddress;
    let signer:Wallet;

    let sample: MockableContract<SamplePriceAware>;

    it("should deploy contracts", async function () {
        [owner] = await ethers.getSigners();

        signer = new ethers.Wallet(MockPriceFeed.P_KEY, owner.provider);

        const SamplePriceAware = await ethers.getContractFactory("SamplePriceAware");
        sample = (await SamplePriceAware.deploy()) as MockableContract<SamplePriceAware>;
        await sample.authorizeSigner(signer.address);
    });

    it("should get price", async function () {
        await sample.execute(1);

        sample = WrapperBuilder
          .mock(sample)
          .using(DEFAULT_PRICE);
        await syncTime();
        await sample.executeWithPrice(7);
    });
});


describe("Price Aware - inlined assembly version", function () {
    let owner:SignerWithAddress;
    let signer:Wallet;

    let sample: SampleInlinedPriceAwareAsm;

    const PRIV = "0xae2b81c1fe9e3b01f060362f03abd0c80a6447cfe00ff7fc7fcf000000000000";

    it("should deploy contracts", async function () {
        [owner] = await ethers.getSigners();

        signer = new ethers.Wallet(PRIV, owner.provider);

        const SampleInlinedPriceAwareAsm = await ethers.getContractFactory("SampleInlinedPriceAwareAsm");
        sample = (await SampleInlinedPriceAwareAsm.deploy()) as SampleInlinedPriceAwareAsm;
    });

    it("should get price", async function () {

        sample = WrapperBuilder
          .mockLite(sample)
          .using(DEFAULT_PRICE);

        //await syncTime(); // recommended for hardhat test
        await sample.executeWithPrice(7);
    });
});


describe("Price Aware - editable assembly version", function () {
    let owner:SignerWithAddress;
    let signer:Wallet;

    let sample: SamplePriceAwareAsm;

    it("should deploy contracts", async function () {
        [owner] = await ethers.getSigners();

        signer = new ethers.Wallet(MockPriceFeed.P_KEY, owner.provider);

        const SamplePriceAwareAsm = await ethers.getContractFactory("SamplePriceAwareAsm");
        sample = (await SamplePriceAwareAsm.deploy()) as SamplePriceAwareAsm;
    });

    it("should get price", async function () {

        sample = WrapperBuilder
          .mockLite(sample)
          .using(DEFAULT_PRICE);

        await sample.authorizeProvider();

        //await syncTime(); // recommended for hardhat test
        await sample.executeWithPrice(7);
    });
});

describe("Price Aware - redstone realtime feed", function () {
    let owner:SignerWithAddress;
    let signer:Wallet;

    let sample: SamplePriceAwareAsm;

    it("should deploy contracts", async function () {
        [owner] = await ethers.getSigners();

        signer = new ethers.Wallet(MockPriceFeed.P_KEY, owner.provider);

        const SamplePriceAwareAsm = await ethers.getContractFactory("SamplePriceAwareAsm");
        sample = (await SamplePriceAwareAsm.deploy()) as SamplePriceAwareAsm;
    });

    it("should get price with single asset", async function () {

        sample = WrapperBuilder
            .wrapLite(sample)
            .usingPriceFeed("redstone-stocks", "IBM");

        await sample.authorizeProvider();

        //await syncTime(); // recommended for hardhat test
        await sample.executeWithPrice(7);
    });

    it("should get price with multiple assets", async function () {

        sample = WrapperBuilder
            .wrapLite(sample)
            .usingPriceFeed("redstone-stocks");

        await sample.authorizeProvider();

        await syncTime(); // recommended for hardhat test
        await sample.executeWithPrice(7);
    });
});
