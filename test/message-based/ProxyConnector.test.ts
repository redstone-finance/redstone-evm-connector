import {ethers} from "hardhat";
import {Wallet} from "ethers";
import chai, {expect} from "chai";
import {solidity} from "ethereum-waffle";
import {SampleProxyConnector} from "../../typechain/SampleProxyConnector";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {syncTime, toBytes32} from "../_helpers";
import {MockPriceFeed} from "../../utils/v2/connector/impl/MockPriceFeed";
import {WrapperBuilder} from "../../index";

chai.use(solidity);


describe("Proxy Connector", function () {
    let owner:SignerWithAddress;
    let signer:Wallet;

    let sample: SampleProxyConnector;

    it("should deploy contracts", async function () {
        [owner] = await ethers.getSigners();

        signer = new ethers.Wallet(MockPriceFeed.P_KEY, owner.provider);

        const SampleProxyConnector = await ethers.getContractFactory("SampleProxyConnector");
        sample = (await SampleProxyConnector.deploy()) as SampleProxyConnector;
    });


    it("should return correct 1st price for one price data set", async function () {
        const mockPrices = [
            {symbol: "ETH", value: 10}
        ];

        sample = WrapperBuilder
            .mockLite(sample)
            .using(
            () => {
                return {
                    prices: mockPrices,
                    timestamp: Date.now()
                }
            });

        await sample.initializePriceAware();

        await syncTime(); // recommended for hardhat test
        await expect(sample.checkPrice(toBytes32("ETH"), 1000000000)).not.to.be.reverted;
        await expect(sample.checkPrice(toBytes32("ETH"), 9999)).to.be.revertedWith("Wrong price!");
    });

    it("should return correct prices for two prices data set", async function () {
        const mockPrices = [
            {symbol: "ETH", value: 10},
            {symbol: "AVAX", value: 5}
        ];

        sample = WrapperBuilder
            .mockLite(sample)
            .using(
                () => {
                    return {
                        prices: mockPrices,
                        timestamp: Date.now()
                    }
                });

        await sample.initializePriceAware();

        await syncTime(); // recommended for hardhat test
        await expect(sample.checkPrice(toBytes32("ETH"), 1000000000)).not.to.be.reverted;
        await expect(sample.checkPrice(toBytes32("ETH"), 9999)).to.be.revertedWith("Wrong price!");

        await expect(sample.checkPrice(toBytes32("AVAX"), 500000000)).not.to.be.reverted;
        await expect(sample.checkPrice(toBytes32("AVAX"), 9999)).to.be.revertedWith("Wrong price!");
    });

    it("should return correct prices for 10 prices data set", async function () {
        const mockPrices = [
            {symbol: "ETH", value: 4000},
            {symbol: "AVAX", value: 5},
            {symbol: "BTC", value: 100000},
            {symbol: "LINK", value: 2},
            {symbol: "UNI", value: 200},
            {symbol: "FRAX", value: 1},
            {symbol: "OMG", value: 0.00003},
            {symbol: "DOGE", value: 2},
            {symbol: "SOL", value: 11},
            {symbol: "BNB", value: 31},
        ];

        sample = WrapperBuilder
            .mockLite(sample)
            .using(
                () => {
                    return {
                        prices: mockPrices,
                        timestamp: Date.now()
                    }
                });

        await sample.initializePriceAware();

        await syncTime(); // recommended for hardhat test
        await expect(sample.checkPrice(toBytes32("ETH"), 400000000000)).not.to.be.reverted;
        await expect(sample.checkPrice(toBytes32("AVAX"), 500000000)).not.to.be.reverted;
        await expect(sample.checkPrice(toBytes32("BTC"), 10000000000000)).not.to.be.reverted;
        await expect(sample.checkPrice(toBytes32("LINK"), 200000000)).not.to.be.reverted;
        await expect(sample.checkPrice(toBytes32("UNI"), 20000000000)).not.to.be.reverted;
        await expect(sample.checkPrice(toBytes32("FRAX"), 100000000)).not.to.be.reverted;
        await expect(sample.checkPrice(toBytes32("OMG"), 3000)).not.to.be.reverted;
        await expect(sample.checkPrice(toBytes32("DOGE"), 200000000)).not.to.be.reverted;
        await expect(sample.checkPrice(toBytes32("SOL"), 1100000000)).not.to.be.reverted;
        await expect(sample.checkPrice(toBytes32("BNB"), 3100000000)).not.to.be.reverted;
    });

    it("should return correct prices for a short encoded function", async function () {
        const mockPrices = [
            {symbol: "ETH", value: 10}
        ];

        sample = WrapperBuilder
            .mockLite(sample)
            .using(
                () => {
                    return {
                        prices: mockPrices,
                        timestamp: Date.now()
                    }
                });

        await sample.initializePriceAware();

        await syncTime(); // recommended for hardhat test
        await expect(sample.getPriceShortEncodedFunction(toBytes32("ETH"), 1000000000)).not.to.be.reverted;
        await expect(sample.getPriceShortEncodedFunction(toBytes32("ETH"), 9999)).to.be.revertedWith("Wrong price!");
    });

    it("should return correct prices for a long encoded function", async function () {
        const mockPrices = [
            {symbol: "ETH", value: 10}
        ];

        sample = WrapperBuilder
            .mockLite(sample)
            .using(
                () => {
                    return {
                        prices: mockPrices,
                        timestamp: Date.now()
                    }
                });

        await sample.initializePriceAware();

        await syncTime(); // recommended for hardhat test
        await expect(sample.getPriceLongEncodedFunction(toBytes32("ETH"), 1000000000)).not.to.be.reverted;
        await expect(sample.getPriceLongEncodedFunction(toBytes32("ETH"), 9999)).to.be.revertedWith("Wrong price!");
    });
});


