import {ethers} from "hardhat";
import {Wallet} from "ethers";
import chai, {expect} from "chai";
import {solidity} from "ethereum-waffle";
import {SamplePriceAwareWithManySigners} from "../../typechain/SamplePriceAwareWithManySigners";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {syncTime, toBytes32} from "../_helpers";
import {MockPriceFeed} from "../../utils/v2/connector/impl/MockPriceFeed";
import {WrapperBuilder} from "../../index";
import { DataSourcesConfig } from "../../utils/v2/connector/impl/RedStonePriceFeed";

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

    it("should get price with multiple assets redstone-avalanche 1st provider", async function () {
        sample = WrapperBuilder
            .wrapLite(sample)
            .usingPriceFeed("redstone-avalanche", {
                dataSources: {
                    sources: [
                        // This source should fail
                        {
                            "type": "cache-layer",
                            "url": "https://api.redstone.finance/zxcxzcxzcxz-bad-path",
                            "providerId": "6bZ3yxPYy0LHPqo7MNqw0PHTeIM2PR-RmfTPYLltsfw",
                            "evmSignerAddress": "0x41ed5321B76C045f5439eCf9e73F96c6c25B1D75",
                        },
                        // This source should work fine
                        {
                            "type": "cache-layer",
                            "url": "https://api.redstone.finance",
                            "providerId": "f1Ipos2fVPbxPVO65GBygkMyW0tkAhp2hdprRPPBBN8",
                            "evmSignerAddress": "0x3a7d971De367FE15D164CDD952F64205F2D9f10c"
                        },
                        // This source should also fail
                        {
                            "type": "cache-layer",
                            "url": "https://api.redstone.finance/zxcxzcxzcxz-bad-path-2",
                            "providerId": "6bZ3yxPYy0LHPqo7MNqw0PHTeIM2PR-RmfTPYLltsfw",
                            "evmSignerAddress": "0x41ed5321B76C045f5439eCf9e73F96c6c25B1D75",
                        },
                    ],
                    defaultSignerEvmAddress: "0x3a7d971de367fe15d164cdd952f64205f2d9f10c",
                    valueSelectionAlgorithm: "first-valid",
                    timeoutMilliseconds: 10000,
                    maxTimestampDiffMilliseconds: 150000,
                    preVerifySignatureOffchain: true,
                },
            });
    
        // await sample.authorizeProvider(); <- note, it's not reuired in this test
        await syncTime(); // recommended for hardhat test
        await sample.executeWithPrice(toBytes32("AVAX"));
    });

    it("should get price with multiple assets redstone-avalanche 2nd provider", async function () {
        sample = WrapperBuilder
            .wrapLite(sample)
            .usingPriceFeed("custom", {
                dataSources: {
                    sources: [
                        // This source should fail
                        {
                            "type": "cache-layer",
                            "url": "https://api.redstone.finance/zxcxzcxzcxz-bad-path",
                            "providerId": "6bZ3yxPYy0LHPqo7MNqw0PHTeIM2PR-RmfTPYLltsfw",
                            "evmSignerAddress": "0x41ed5321B76C045f5439eCf9e73F96c6c25B1D75",
                        },
                        // This source should work fine 
                        {
                            "type": "cache-layer",
                            "url": "https://api.redstone.finance",
                            "providerId": "6bZ3yxPYy0LHPqo7MNqw0PHTeIM2PR-RmfTPYLltsfw",
                            "evmSignerAddress": "0x41ed5321B76C045f5439eCf9e73F96c6c25B1D75",
                        },
                    ],
                    defaultSignerEvmAddress: "0x41ed5321B76C045f5439eCf9e73F96c6c25B1D75",
                    valueSelectionAlgorithm: "first-valid",
                    timeoutMilliseconds: 10000,
                    maxTimestampDiffMilliseconds: 150000,
                    preVerifySignatureOffchain: true,
                },
            });
    
        // await sample.authorizeProvider(); <- note, it's not reuired in this test
        await syncTime(); // recommended for hardhat test
        await sample.executeWithPrice(toBytes32("AVAX"));
    });

    it("should fail", async function () {
        const baseDataSources: DataSourcesConfig = {
            sources: [
                // This source should fail
                {
                    "type": "cache-layer",
                    "url": "https://api.redstone.finance/zxcxzcxzcxz-bad-path",
                    "providerId": "6bZ3yxPYy0LHPqo7MNqw0PHTeIM2PR-RmfTPYLltsfw",
                    "evmSignerAddress": "0x41ed5321B76C045f5439eCf9e73F96c6c25B1D75",
                },
                // This price package should be too old
                {
                    "type": "cache-layer",
                    // Under the arweave url below we store redstone-avalanche data package for 2022-01-25T02:49:08
                    "url": "https://hv4gxzchk24cqfezebn3ujjz6oy2kbtztv5vghn6kpbkjc3vg4rq.arweave.net/AdGnv1Am7Bj5ru1OrNETZC0Rl6VvPFihAHX-wqn2r0k",
                    "providerId": "6bZ3yxPYy0LHPqo7MNqw0PHTeIM2PR-RmfTPYLltsfw",
                    "evmSignerAddress": "0x41ed5321B76C045f5439eCf9e73F96c6c25B1D75",
                },
            ],
            defaultSignerEvmAddress: "0x41ed5321B76C045f5439eCf9e73F96c6c25B1D75",
            valueSelectionAlgorithm: "first-valid",
            timeoutMilliseconds: 10000,
            maxTimestampDiffMilliseconds: 150000,
            preVerifySignatureOffchain: false,
        };

        sample = WrapperBuilder
            .wrapLite(sample)
            .usingPriceFeed("custom", {
                dataSources: baseDataSources,
            });
    
        // await sample.authorizeProvider(); <- note, it's not reuired in this test
        await syncTime(); // recommended for hardhat test

        // Should fail
        try {
            await sample.executeWithPrice(toBytes32("AVAX"))
            throw new Error("Should have been failed with bad sources");
        } catch (e) {
            console.log("Ok, but we should improve this test");
        }

        sample = WrapperBuilder
            .wrapLite(sample)
            .usingPriceFeed("custom", {
                dataSources: {
                    ...baseDataSources,
                    maxTimestampDiffMilliseconds: 42 * 365 * 24 * 3600 * 1000, // 42 years
                    preVerifySignatureOffchain: false,
                },
            });

        await syncTime(); // recommended for hardhat test

        await expect(sample.executeWithPrice(toBytes32("AVAX"))).to.be.revertedWith("Data is too old");
    });
});
