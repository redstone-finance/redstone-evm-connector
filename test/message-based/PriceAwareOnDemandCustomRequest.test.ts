import {ethers} from "hardhat";
import chai, {expect} from "chai";
import {solidity} from "ethereum-waffle";
import {SamplePriceAwareOnDemandCustomRequest} from "../../typechain/SamplePriceAwareOnDemandCustomRequest";
import {syncTime} from "../_helpers";
import {WrapperBuilder} from "../../index";

chai.use(solidity);

describe("Price Aware - on demand custom request", function () {

    let sampleContract: SamplePriceAwareOnDemandCustomRequest;

    it("should deploy contracts", async function () {
        const contractFactory = await ethers.getContractFactory("SamplePriceAwareOnDemandCustomRequest");
        sampleContract = (await contractFactory.deploy()) as SamplePriceAwareOnDemandCustomRequest;
    });

    it("should correctly get value from on-demand custom request", async function () {

        sampleContract = WrapperBuilder.wrapLite(sampleContract).usingCustomRequestsOnDemand({
            nodes: ["https://requests-proxy-node-1.redstone.finance"],
            customRequestDetails: {
                url: "https://httpbin.org/anything?hehe=123.25",
                jsonpath: "$.args.hehe",
                expectedSymbol: "0xd315c01cedca9a54",
            },
        });

        await syncTime(); // recommended for hardhat test
        const value = await sampleContract.getValue();
        expect(value).to.be.equal(123.25 * 10 ** 8);
    });

});
