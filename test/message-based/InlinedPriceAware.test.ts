import {ethers} from "hardhat";
import {Wallet} from "ethers";
import chai, {expect} from "chai";
import {solidity} from "ethereum-waffle";

import {SampleInlinedPriceAware} from "../../typechain/SampleInlinedPriceAware";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/signers";
import {syncTime, toBytes32} from "../_helpers";
import {WrapperBuilder} from "../../index";
import {DEFAULT_PRICE} from "../../utils/v2/impl/builder/MockableEthersContractWrapperBuilder";
import {BigNumber} from "@ethersproject/bignumber";

chai.use(solidity);


describe("Price Aware - inlined assembly version", function () {
    let owner:SignerWithAddress;
    let signer:Wallet;

    let sample: SampleInlinedPriceAware;

    const PRIV = "0xae2b81c1fe9e3b01f060362f03abd0c80a6447cfe00ff7fc7fcf000000000000";

    it("should deploy contracts", async function () {
        [owner] = await ethers.getSigners();

        signer = new ethers.Wallet(PRIV, owner.provider);

        const SampleInlinedPriceAware = await ethers.getContractFactory("SampleInlinedPriceAware");
        sample = (await SampleInlinedPriceAware.deploy()) as SampleInlinedPriceAware;
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
