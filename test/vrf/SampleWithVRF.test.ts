import { ethers } from "hardhat";
import { WrapperBuilder } from "../../index";
import { SampleWithVRF } from "../../typechain/SampleWithVRF";
// import { expect } from "chai";

describe("Sample with VRF", function () {
  let sampleContract: SampleWithVRF;

  beforeEach(async () => {
    const SampleWithVRFFactory = await ethers.getContractFactory("SampleWithVRF");
    sampleContract = await SampleWithVRFFactory.deploy() as SampleWithVRF;
  });

  it("Test VRF", async function () {
    // Wrapping the contract instnace using VRF wrapper
    const wrappedSampleContract = WrapperBuilder
      .wrapWithVRF(sampleContract)
      .usingVRFNode({
        url: "https://redstone-vrf-oracle-node-1.redstone.finance/vrf-requests",
      });
      

    // Sending tx
    const tx = await wrappedSampleContract.updateLastRandomValue();
    await tx.wait();

    // Getting last random value from storage
    const lastRandomNumber = await wrappedSampleContract.lastRandomValue();
    console.log(`Last random value: ${lastRandomNumber}`);

    // TODO: add few expect statements
  });
});
