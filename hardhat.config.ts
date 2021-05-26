import "@nomiclabs/hardhat-waffle";
import "hardhat-gas-reporter";
import "hardhat-typechain";

export default {
  solidity: "0.8.0",
  networks: {
    hardhat: {
      chainId: 7
    }
  }
};

