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
                url: "https://min-api.cryptocompare.com/data/pricemultifull?fsyms=ETH&tsyms=USD",
                jsonpath: "$.RAW.ETH.USD.PRICE",
                expectedSymbol: "0x031f7bcd73d9f5ed",
            },
        });

        await syncTime(); // recommended for hardhat test
        const value = await sampleContract.getValue();
        console.log(`Value from contract: ${value.toNumber()}`);
    });

});
