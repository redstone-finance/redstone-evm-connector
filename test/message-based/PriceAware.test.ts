import {ethers, waffle} from "hardhat";
import { Wallet } from "ethers";
import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";

import { SampleInlinedMockPriceAware } from "../../typechain/SampleInlinedMockPriceAware";
import { SamplePriceAware } from "../../typechain/SamplePriceAware";
import { SamplePriceAwareUpgradeable } from "../../typechain/SamplePriceAwareUpgradeable";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {TransparentUpgradeableProxy} from "../../typechain/TransparentUpgradeableProxy";
import {SamplePriceAwareUpgradeable__factory, TransparentUpgradeableProxy__factory} from "../../typechain";
import { syncTime, toBytes32 } from "../_helpers";
import { MockPriceFeed } from "../../utils/v2/connector/impl/MockPriceFeed";
import { WrapperBuilder } from "../../index";
import { DEFAULT_PRICE } from "../../utils/v2/impl/builder/MockableEthersContractWrapperBuilder";
import { BigNumber } from "@ethersproject/bignumber";

chai.use(solidity);

// describe("Price Aware - basic version (v1 version)", function () {
//     let owner:SignerWithAddress;
//     let signer:Wallet;

//     let sample: MockableContract<SamplePriceAwareV1>;

//     it("should deploy contracts", async function () {
//         [owner] = await ethers.getSigners();

//         signer = new ethers.Wallet(MockPriceFeed.P_KEY, owner.provider);

//         const SamplePriceAware = await ethers.getContractFactory("SamplePriceAwareV1");
//         sample = (await SamplePriceAware.deploy()) as MockableContract<SamplePriceAwareV1>;
//         await sample.authorizeSigner(signer.address);
//     });

//     it("should get price", async function () {
//         await sample.execute(1);

//         sample = WrapperBuilder
//           .mock(sample)
//           .using(DEFAULT_PRICE);
//         await syncTime();
//         await sample.executeWithPrice(7);
//     });
// });


describe("Price Aware - inlined assembly version", function () {
    let owner:SignerWithAddress;
    let signer:Wallet;

    let sample: SampleInlinedMockPriceAware;

    const PRIV = "0xae2b81c1fe9e3b01f060362f03abd0c80a6447cfe00ff7fc7fcf000000000000";

    it("should deploy contracts", async function () {
        [owner] = await ethers.getSigners();

        signer = new ethers.Wallet(PRIV, owner.provider);

        const SampleInlinedPriceAware = await ethers.getContractFactory("SampleInlinedMockPriceAware");
        sample = (await SampleInlinedPriceAware.deploy()) as SampleInlinedMockPriceAware;
    });

    it("should benchmark costs", async function () {

        sample = WrapperBuilder
          .mockLite(sample)
          .using(DEFAULT_PRICE);

        await syncTime(); // recommended for hardhat test
        await sample.executeWithPrice(toBytes32("ETH"));
    });

    it("should return the correct 1st price", async function () {
        sample = WrapperBuilder
          .mockLite(sample)
          .using(DEFAULT_PRICE);

        await syncTime(); // recommended for hardhat test
        let price = await sample.getPriceFromMsgPublic(toBytes32("ETH"));
        expect(price).to.equal(BigNumber.from("1000000000"));
    });


    it("should return the correct 2nd price", async function () {
        sample = WrapperBuilder
          .mockLite(sample)
          .using(DEFAULT_PRICE);

        await syncTime(); // recommended for hardhat test
        let price = await sample.getPriceFromMsgPublic(toBytes32("AVAX"));
        expect(price).to.equal(BigNumber.from("500000000"));
    });

    it("should return 0 for non-existing price", async function () {
        sample = WrapperBuilder
          .mockLite(sample)
          .using(DEFAULT_PRICE);

        await syncTime(); // recommended for hardhat test
        let price = await sample.getPriceFromMsgPublic(toBytes32("LOL"));
        expect(price).to.equal(BigNumber.from("0"));
    });
});


describe("Price Aware - editable assembly version", function () {
    let owner:SignerWithAddress;
    let signer:Wallet;

    let sample: SamplePriceAware;

    it("should deploy contracts", async function () {
        [owner] = await ethers.getSigners();

        signer = new ethers.Wallet(MockPriceFeed.P_KEY, owner.provider);

        const SamplePriceAware = await ethers.getContractFactory("SamplePriceAware");
        sample = (await SamplePriceAware.deploy()) as SamplePriceAware;
    });

    it("wrapped contract should have ethers methods: connect, attach", function () {
      sample = WrapperBuilder
          .mockLite(sample)
          .using(DEFAULT_PRICE);

      expect(sample.connect).to.not.equal(undefined);
      expect(sample.attach).to.not.equal(undefined);

      sample.connect(owner);
    });

    it("should benchmark costs", async function () {

        sample = WrapperBuilder
          .mockLite(sample)
          .using(DEFAULT_PRICE);

        await sample.authorizeProvider();

        await syncTime(); // recommended for hardhat test
        await sample.executeWithPrice(toBytes32("ETH"));
    });


    it("should return the correct 1st price", async function () {
        sample = WrapperBuilder
          .mockLite(sample)
          .using(DEFAULT_PRICE);

        await sample.authorizeProvider();

        await syncTime(); // recommended for hardhat test
        let price = await sample.getPriceFromMsgPublic(toBytes32("ETH"));
        expect(price).to.equal(BigNumber.from("1000000000"));
    });

    it("should return the correct 1st price (passing object with values)", async function () {
      sample = WrapperBuilder
        .mockLite(sample)
        .using({"ETH": 125});

      await sample.authorizeProvider();

      await syncTime(); // recommended for hardhat test
      let price = await sample.getPriceFromMsgPublic(toBytes32("ETH"));
      expect(price).to.equal(BigNumber.from(125 * 10 ** 8));
  });


    it("should return the correct 2nd price", async function () {
        sample = WrapperBuilder
          .mockLite(sample)
          .using(DEFAULT_PRICE);

        await sample.authorizeProvider();

        await syncTime(); // recommended for hardhat test
        let price = await sample.getPriceFromMsgPublic(toBytes32("AVAX"));
        expect(price).to.equal(BigNumber.from("500000000"));
    });

    it("should return 0 for non-existing price", async function () {
        sample = WrapperBuilder
          .mockLite(sample)
          .using(DEFAULT_PRICE);

        await sample.authorizeProvider();

        await syncTime(); // recommended for hardhat test
        let price = await sample.getPriceFromMsgPublic(toBytes32("LOL"));
        expect(price).to.equal(BigNumber.from("0"));
    });
});

// describe("Price Aware - redstone realtime feed", function () {
//     let owner:SignerWithAddress;
//     let signer:Wallet;

//     let sample: SamplePriceAware;

//     it("should deploy contracts", async function () {
//         [owner] = await ethers.getSigners();

//         signer = new ethers.Wallet(MockPriceFeed.P_KEY, owner.provider);

//         const SamplePriceAware = await ethers.getContractFactory("SamplePriceAware");
//         sample = (await SamplePriceAware.deploy()) as SamplePriceAware;
//     });

//     it("should get price with single asset", async function () {

//         sample = WrapperBuilder
//             .wrapLite(sample)
//             .usingPriceFeed("redstone-stocks", "IBM");

//         await sample.authorizeProvider();

//         //await syncTime(); // recommended for hardhat test
//         await sample.executeWithPrice(toBytes32("IBM"));
//     });

//     it("should get price with multiple assets", async function () {

//         sample = WrapperBuilder
//             .wrapLite(sample)
//             .usingPriceFeed("redstone-stocks");

//         await sample.authorizeProvider();

//         await syncTime(); // recommended for hardhat test
//         await sample.executeWithPrice(toBytes32("IBM"));
//     });
// });

const ASSET_PRICES = (forTime: number) => ({
    prices: [
        {symbol: "ETH", value: 10},
        {symbol: "AVAX", value: 5},
        {symbol: "BTC", value: 30},
        {symbol: "LINK", value: 2}
    ],
    timestamp: forTime - 1000
});

describe("Price Aware - upgradeable version", function () {
    let owner:SignerWithAddress;
    let admin:SignerWithAddress;
    let signer:Wallet;
    let sample: SamplePriceAwareUpgradeable;
    let proxy: TransparentUpgradeableProxy;

    it("should deploy contracts", async function () {
        [owner] = await ethers.getSigners();

        signer = new ethers.Wallet(MockPriceFeed.P_KEY, owner.provider);

        const SamplePriceAwareUpgradeable = await ethers.getContractFactory("SamplePriceAwareUpgradeable");
        sample = (await SamplePriceAwareUpgradeable.deploy()) as SamplePriceAwareUpgradeable;
        await sample.initialize();

        await syncTime(); // recommended for hardhat test

    });

    it("should get price for one asset", async function () {

        sample = WrapperBuilder
            .mockLite(sample)
            .using(ASSET_PRICES);

        await sample.authorizeProvider();

        await syncTime(); // recommended for hardhat test

        await sample.getPrice(toBytes32("BTC"));
        const price = await sample.getPrice(toBytes32("BTC"));

        expect(price).to.be.equal(3000000000);
    });

    it("should get prices for several assets", async function () {

        sample = WrapperBuilder
            .mockLite(sample)
            .using(ASSET_PRICES);

        await sample.authorizeProvider();

        await syncTime(); // recommended for hardhat test

        const prices = await sample.getPrices([
            toBytes32("ETH"),
            toBytes32("LINK"),
            toBytes32("BTC"),
            toBytes32("AVAX")
        ]);

        expect(prices.join(',')).to.be.equal('1000000000,200000000,3000000000,500000000');
    });

    const ASSET_PRICES_35 = (forTime: number) => ({
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
            {symbol: "TRX", value: 1},
            {symbol: "ETC", value: 1},
            {symbol: "FIL", value: 1},
            {symbol: "MATIC", value: 1},
            {symbol: "SUSHI", value: 1},
            {symbol: "OMG", value: 1},
            {symbol: "BNB", value: 1},
            {symbol: "SOL", value: 1},
            {symbol: "XMR", value: 1},
            {symbol: "OCEAN", value: 1},
            {symbol: "LUNA", value: 1},
            {symbol: "CRO", value: 1},
            {symbol: "MDX", value: 1},
            {symbol: "NFT", value: 1},
            {symbol: "MANA", value: 1},
            {symbol: "CEL", value: 1},
            {symbol: "ALICE", value: 1},
            {symbol: "CELO", value: 1},
            {symbol: "FLOW", value: 1},
            {symbol: "AMP", value: 1},
            {symbol: "UST", value: 7},
            {symbol: "BOND", value: 1},
            {symbol: "OXY", value: 1},
            {symbol: "ALPACA", value: 1},
            {symbol: "ELON", value: 1},
            {symbol: "MKR", value: 7},
        ],
        timestamp: forTime - 1000
    });

    it("should get prices for more than 32 assets returned from an oracle", async function () {

        sample = WrapperBuilder
            .mockLite(sample)
            .using(ASSET_PRICES_35);

        await sample.authorizeProvider();

        await syncTime(); // recommended for hardhat test

        const prices = await sample.getPrices([
            toBytes32("ETH"),
            toBytes32("LINK"),
            toBytes32("BTC"),
            toBytes32("MKR")
        ]);

        expect(prices.join(',')).to.be.equal('1000000000,200000000,3000000000,700000000');
    });


    it("should return 0 price for non-supported assets", async function () {

        sample = WrapperBuilder
            .mockLite(sample)
            .using(ASSET_PRICES);

        await sample.authorizeProvider();

        await syncTime(); // recommended for hardhat test

        const prices = await sample.getPrices([
            toBytes32("ETH"),
            toBytes32("NOT_SUPPORTED_TOKEN_1"),
            toBytes32("BTC"),
            toBytes32("NOT_SUPPORTED_TOKEN_2")
        ]);

        expect(prices.join(',')).to.be.equal('1000000000,0,3000000000,0');
    });

    it("should return empty array for empty array of symbols", async function () {

        sample = WrapperBuilder
            .mockLite(sample)
            .using(ASSET_PRICES);

        await sample.authorizeProvider();

        await syncTime(); // recommended for hardhat test

        const prices = await sample.getPrices([
        ]);

        expect(prices.length).to.be.equal(0);
    });

    it("should return prices for duplicated symbols", async function () {

        sample = WrapperBuilder
            .mockLite(sample)
            .using(ASSET_PRICES);

        await sample.authorizeProvider();

        await syncTime(); // recommended for hardhat test

        const prices = await sample.getPrices([
            toBytes32("ETH"),
            toBytes32("ETH"),
            toBytes32("BTC"),
            toBytes32("ETH")
        ]);

        expect(prices.join(",")).to.be.equal("1000000000,1000000000,3000000000,1000000000");
    });

    it("should not accept wrong format", async function () {

        sample = WrapperBuilder
            .mockLite(sample)
            .using(ASSET_PRICES);

        await sample.authorizeProvider();

        await syncTime(); // recommended for hardhat test

        await expect(sample.getPrices(["BTC"])).to.be.reverted;
    });

    it("should deploy a contract behind a proxy", async () => {
        [owner, admin] = await ethers.getSigners();
        const SamplePriceAwareUpgradeable = await ethers.getContractFactory("SamplePriceAwareUpgradeable");
        sample = (await SamplePriceAwareUpgradeable.deploy()) as SamplePriceAwareUpgradeable;

        proxy = await (new TransparentUpgradeableProxy__factory(owner).deploy(sample.address, admin.address, []));
        sample = await (new SamplePriceAwareUpgradeable__factory(owner).attach(proxy.address));

        expect(await sample.maxDelay()).equals(0);

        await sample.initialize();

        expect(await sample.maxDelay()).equals(180);
    });

    it("should benchmark gas costs", async function () {

        sample = WrapperBuilder
            .mockLite(sample)
            .using(ASSET_PRICES);

        await sample.authorizeProvider();

        await syncTime(); // recommended for hardhat test

        await sample.executeWithPrice(toBytes32("BTC"));
        await sample.executeWithPrices([toBytes32("BTC")]);
    });
});
