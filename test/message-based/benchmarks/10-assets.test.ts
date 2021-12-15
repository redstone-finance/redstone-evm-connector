import {ethers} from "hardhat";
import {Wallet} from "ethers";
import chai from "chai";
import {solidity} from "ethereum-waffle";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {
    SampleNonAssemblySinglePriceAware,
    SampleSinglePriceAware,
    SamplePriceAware,
    SampleInlinedSinglePriceAware,
    SampleInlinedPriceAware,
    SampleSinglePriceAwareUpgradeable,
    SamplePriceAwareUpgradeable
} from "../../../typechain";
import {syncTime, toBytes32} from "../../_helpers";
import {MockPriceFeed} from "../../../utils/v2/connector/impl/MockPriceFeed";
import {WrapperBuilder} from "../../../index";
import {MockableContract} from "../../../utils/v2/impl/builder/MockableEthersContractWrapperBuilder";

chai.use(solidity);

describe("Benchmark- price aware contracts", function () {
    let owner:SignerWithAddress;
    let signer:Wallet;

    let nonAssemblySinglePriceAware: MockableContract<SampleNonAssemblySinglePriceAware>;
    let singlePriceAware: MockableContract<SampleSinglePriceAware>;
    let priceAware: MockableContract<SamplePriceAware>;
    let inlinedSinglePriceAware: MockableContract<SampleInlinedSinglePriceAware>;
    let inlinedPriceAware: MockableContract<SampleInlinedPriceAware>;
    let singlePriceAwareUpgradeable: MockableContract<SampleSinglePriceAwareUpgradeable>;
    let priceAwareUpgradeable: MockableContract<SamplePriceAwareUpgradeable>;

    it("should deploy contracts", async function () {
        [owner] = await ethers.getSigners();

        signer = new ethers.Wallet(MockPriceFeed.P_KEY, owner.provider);

        await syncTime(); // recommended for hardhat test

        const SampleNonAssemblySinglePriceAware = await ethers.getContractFactory("SampleNonAssemblySinglePriceAware");
        nonAssemblySinglePriceAware = (await SampleNonAssemblySinglePriceAware.deploy()) as MockableContract<SampleNonAssemblySinglePriceAware>;
        nonAssemblySinglePriceAware = wrapContract(nonAssemblySinglePriceAware);

        const SampleSinglePriceAware = await ethers.getContractFactory("SampleSinglePriceAware");
        singlePriceAware = (await SampleSinglePriceAware.deploy()) as MockableContract<SampleSinglePriceAware>;
        singlePriceAware = authorizeAndWrapContract(singlePriceAware);

        //current version
        const SamplePriceAware = await ethers.getContractFactory("SamplePriceAware");
        priceAware = (await SamplePriceAware.deploy()) as MockableContract<SamplePriceAware>;
        priceAware = authorizeAndWrapContract(priceAware);

        const SampleInlinedSinglePriceAware = await ethers.getContractFactory("SampleInlinedSinglePriceAware");
        inlinedSinglePriceAware = (await SampleInlinedSinglePriceAware.deploy()) as MockableContract<SampleInlinedSinglePriceAware>;
        inlinedSinglePriceAware = wrapContract(inlinedSinglePriceAware);

        //current version
        const SampleInlinedPriceAware = await ethers.getContractFactory("SampleInlinedPriceAware");
        inlinedPriceAware = (await SampleInlinedPriceAware.deploy()) as MockableContract<SampleInlinedPriceAware>;
        inlinedPriceAware = wrapContract(inlinedPriceAware);

        const SampleSinglePriceAwareUpgradeable = await ethers.getContractFactory("SampleSinglePriceAwareUpgradeable");
        singlePriceAwareUpgradeable = (await SampleSinglePriceAwareUpgradeable.deploy()) as MockableContract<SampleSinglePriceAwareUpgradeable>;
        singlePriceAwareUpgradeable = authorizeAndWrapContract(singlePriceAwareUpgradeable);
        await singlePriceAwareUpgradeable.initialize();

        //current version
        const SamplePriceAwareUpgradeable = await ethers.getContractFactory("SamplePriceAwareUpgradeable");
        priceAwareUpgradeable = (await SamplePriceAwareUpgradeable.deploy()) as MockableContract<SamplePriceAwareUpgradeable>;
        priceAwareUpgradeable = authorizeAndWrapContract(priceAwareUpgradeable);
        await priceAwareUpgradeable.initialize();
    });

    function authorizeAndWrapContract(contract: any) {
        const wrapped = wrapContract(contract);

        wrapped.authorizeSigner(signer.address);

        return wrapped;
    }

    function wrapContract(contract: any) {

        return WrapperBuilder
            .mockLite(contract)
            .using(ASSET_PRICES_10);
    }

    it("should benchmark costs for 10th asset", async function () {
        await nonAssemblySinglePriceAware.executeWithPrice(toBytes32("ETH"));
        await syncTime(); // recommended for hardhat test
        await singlePriceAware.executeWithPrice(toBytes32("TRX"));
        await syncTime(); // recommended for hardhat test
        await priceAware.executeWithPrice(toBytes32("BTC"));
        await syncTime(); // recommended for hardhat test
        await inlinedSinglePriceAware.executeWithPrice(toBytes32("TRX"));
        await syncTime(); // recommended for hardhat test
        await inlinedPriceAware.executeWithPrice(toBytes32("TRX"));
        await syncTime(); // recommended for hardhat test
        await singlePriceAwareUpgradeable.executeWithPrice(toBytes32("TRX"));
        await syncTime(); // recommended for hardhat test
        await priceAwareUpgradeable.executeWithPrice(toBytes32("TRX"));
    });
});

const ASSET_PRICES_10 = (forTime: number) => ({
    prices: [
        {symbol: "ETH", value: 10},
        {symbol: "AVAX", value: 5},
        {symbol: "BTC", value: 30},
        {symbol: "LINK", value: 2},
        {symbol: "1INCH", value: 1},
        {symbol: "LTC", value: 1},
        {symbol: "UNI", value: 1},
        {symbol: "XRP", value: 1},
        {symbol: "DOGE", value: 1},
        {symbol: "TRX", value: 1}
    ],
    timestamp: forTime - 1000
});