const { expect } = require("chai");

describe("MockDefi contract", function() {



  var owner, defi;

  it("Deployment should have zero balance", async function() {
    [owner] = await ethers.getSigners();

    const Defi = await ethers.getContractFactory("MockDefi");

    defi = await Defi.deploy();

    expect(await defi.balanceOf(owner.address)).to.equal(0);
  });

  it("Should deposit", async function() {
    await defi.deposit(100);

    expect(await defi.balanceOf(owner.address)).to.equal(100);
  });

});
