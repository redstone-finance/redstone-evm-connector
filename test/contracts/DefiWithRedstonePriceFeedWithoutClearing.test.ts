import { ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { MockDefi } from "../../typechain/MockDefi";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {PriceVerifier} from "../../typechain/PriceVerifier";
import redstone from 'redstone-api';
const { wrapContract } = require("../../utils/contract-wrapper");

import { PriceFeedWithoutClearing } from "../../typechain/PriceFeedWithoutClearing";
chai.use(solidity);

const { expect } = chai;

const toBytes32 = ethers.utils.formatBytes32String;
const serialized = function (x: number): number {
    return x * 10**8;
};

describe("MockDefi with Proxy contract and pricing Data", function() {

    const REDSTONE_STOCKS_PROVIDER = "Yba8IVc_01bFxutKNJAZ7CmTD5AVi2GcWXf1NajPAsc";
    const REDSTONE_STOCKS_PROVIDER_ADDRESS = "0x926E370fD53c23f8B71ad2B3217b227E41A92b12";


    let owner: SignerWithAddress;
    let admin: SignerWithAddress;
    let defi: MockDefi;
    let priceFeed: PriceFeedWithoutClearing;
    let verifier: PriceVerifier;
    let apiPrices: any;

    async function loadApiPrices() {
        apiPrices = await redstone.getAllPrices({
            provider: "redstone-stocks",
        });
    }

    it("Deployment should have zero balance", async function() {
        [owner, admin] = await ethers.getSigners();

        const Defi = await ethers.getContractFactory("MockDefi");
        const Proxy = await ethers.getContractFactory("RedstoneUpgradeableProxyWithoutClearing");
        const PriceFeedWithoutClearing = await ethers.getContractFactory("PriceFeedWithoutClearing");
        const Verifier = await ethers.getContractFactory("PriceVerifier");

        verifier = (await Verifier.deploy()) as PriceVerifier;
        priceFeed = (await PriceFeedWithoutClearing.deploy(verifier.address, 5 * 60)) as PriceFeedWithoutClearing;
        await priceFeed.authorizeSigner(REDSTONE_STOCKS_PROVIDER_ADDRESS);
        // console.log("Authorized: ", REDSTONE_STOCKS_PROVIDER_ADDRESS);

        defi = (await Defi.deploy()) as MockDefi;

        // console.log("Defi address: " + defi.address);
        const proxy = await Proxy.deploy(defi.address, priceFeed.address, admin.address, []);

        defi = (await Defi.attach(proxy.address)) as MockDefi;
        await defi.initialize(priceFeed.address);

    });


    it("Should deposit - write no pricing info multi", async function() {

        defi = wrapContract(defi, REDSTONE_STOCKS_PROVIDER);

        await defi.deposit(toBytes32("GOOG"), 1);
        await defi.deposit(toBytes32("IBM"), 1);

    });


    it("Should inject correct prices from API multi", async function() {

        await loadApiPrices();

        expect(await defi.currentValueOf(owner.address, toBytes32("GOOG")))
            .to.be.equal(serialized(apiPrices['GOOG'].value).toFixed(0));
        expect(await defi.currentValueOf(owner.address, toBytes32("IBM")))
            .to.be.equal(serialized(apiPrices['IBM'].value).toFixed(0));

    });


    it("Should deposit - write no pricing info single", async function() {

        defi = wrapContract(defi, REDSTONE_STOCKS_PROVIDER, "FB");

        await Promise.all([
            defi.deposit(toBytes32("FB"), 1),
            loadApiPrices(),
        ]);

    });


    it("Should inject correct prices from API single", async function() {

        // const apiPrices = await redstone.getAllPrices({provider:"redstone-stocks"});

        expect(await defi.currentValueOf(owner.address, toBytes32("FB")))
            .to.be.equal(serialized(apiPrices['FB'].value).toFixed(0));

    });
   

});
