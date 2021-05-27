import "@nomiclabs/hardhat-waffle";
import "hardhat-gas-reporter";
import "hardhat-typechain";

export default {
  solidity: "0.8.2",
  networks: {
    hardhat: {
      chainId: 7
    }
  }
};

