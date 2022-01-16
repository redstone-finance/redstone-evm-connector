import {ethers} from "hardhat";
import {Wallet} from "ethers";
import chai, {expect} from "chai";
import {solidity} from "ethereum-waffle";
import {SamplePriceAwareWithManySigners} from "../../typechain/SamplePriceAwareWithManySigners";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {syncTime, toBytes32} from "../_helpers";
import {MockPriceFeed} from "../../utils/v2/connector/impl/MockPriceFeed";
import {WrapperBuilder} from "../../index";
import {DEFAULT_PRICE} from "../../utils/v2/impl/builder/MockableEthersContractWrapperBuilder";
import {BigNumber} from "@ethersproject/bignumber";

chai.use(solidity);

describe("Price Aware - redstone realtime feed", function () {
    let owner: SignerWithAddress;
    let signer: Wallet;

    let sample: SamplePriceAwareWithManySigners;

    it("should deploy contracts", async function () {
        [owner] = await ethers.getSigners();

        signer = new ethers.Wallet(MockPriceFeed.P_KEY, owner.provider);

        const SamplePriceAwareWithManySigners = await ethers.getContractFactory("SamplePriceAwareWithManySigners");
        sample = (await SamplePriceAwareWithManySigners.deploy()) as SamplePriceAwareWithManySigners;
    });

    it("should get price with single asset", async function () {
        sample = WrapperBuilder
            .wrapLite(sample)
            .usingPriceFeed("redstone-avalanche", { asset: "AVAX" });

        await sample.authorizeProvider();

        await syncTime(); // recommended for hardhat test
        await sample.executeWithPrice(toBytes32("IBM"));
    });

    it("should get price with multiple assets", async function () {
        sample = WrapperBuilder
            .wrapLite(sample)
            .usingPriceFeed("redstone-avalanche");

        await sample.authorizeProvider();

        await syncTime(); // recommended for hardhat test
        await sample.executeWithPrice(toBytes32("AVAX"));
    });
});
