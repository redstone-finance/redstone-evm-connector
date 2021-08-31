# Flash storage

Putting data directly into storage is the easiest to make information accessible to smart contracts. However, the convenience comes at a high price, as the storage access is the most costly operation in [EVM](https://ethereum.github.io/yellowpaper/paper.pdf) (20k gas for 256bit word ~ $160k for 1Mb checked 30/08/2021) making it prohibitively expensive to use.

Flash storage implements an alternative design of providing data to smart contracts. Instead of constantly persisting data on EVM storage, the information is brought on-chain only when needed (**on-demand fetching**). Until that moment, the data remains available in the [Arweave](https://www.arweave.org/) blockchain where data providers are incentivised to keep information accurate and up to date. Data is transferred to EVM via a mechanism based on a [meta-transaction pattern](https://medium.com/@austin_48503/ethereum-meta-transactions-90ccf0859e84) and the information integrity is verified on-chain through signature checking. 



## How it works

At a top level, transferring data to an EVM environment requires packing an extra payload to a user's transaction and processing the message on-chain.
### Data packing

1. Relevant data needs to be fetched from the RedStone api
2. Data is packed into a message according to the following structure

``` 
 [[symbol | 32b][value | 32b] : n times][timestamp | 32b][size | 1b][signature | 65b]
```

3. The package is appended to the original transaction message, signed and submitted to the network

*All of the steps are executed automatically by the ContractWrapper and transparent to the end-user*

### Data unpacking

1. The appended data package is extracted from the `msg.data`
2. The data signature is verified by checking if the signer is one of the approved providers
3. The timestamp is also verified checking if the information is not obsolete
4. The value that matches a given symbol is extracted from the data package

*This logic is executed in the on-chain environment and we optimised the execution using a low-level assembly code to reduce gas consumption to the absolute minimum*

## Getting started

### 1. Modifying your contracts

You need to apply a miniam change to the source code to enable smart contract to access data. Your contract needs to extend the [PriceAware](https://github.com/redstone-finance/redstone-flash-storage/blob/price-aware/contracts/message-based/PriceAwareAsm.sol) contract :

```
contract YourContractName is PriceAwareAsm {
```

After applying the mentioned change you will be able to access the data calling the local [getPriceFromMsg](https://github.com/redstone-finance/redstone-flash-storage/blob/price-aware/contracts/message-based/PriceAwareAsm.sol#L29) function:

```
uint256 ethPrice = getPriceFromMsg(bytes32("ETH"));
```

### 2. Updating the interface

You should also update the code responsible for submitting transactions. If you're using [ethers.js](https://github.com/ethers-io/ethers.js/), we've prepared a dedicated library to make the transition seamless. First, you need to import the wrapper code to your project:

```
import WrapperBuilder from "redstone-flash-storage";
```

Then you can wrap your ethers contract pointing to the selected Redstone data provider:

```
yourEthersContract = WrapperBuilder
                     .wrapLite(yourEthersContract)
                     .usingPriceFeed("redstone", "ETH");
```

Now you can access any of the contract's methods in exactly the same way as interacting with the ethers-js code:

```
yourEthersContract.executeYourMethod();
```

If you're the owner of the contract, the wrapper offers you also a convenient method to authorise a provider without the need of passing the ethereum address (the provider authenticity will be checked via signature verification whenever a user submits a transaction accessing the data):

```
yourEthersContract.authorizeProvider();
```

If you'd like to use the wrapper in a test context, we recommend using a mock provider when you can easily override the price to test different scenarios:


```
yourEthersContract = WrapperBuilder
                     .mockLite(yourEthersContract)
                     .using(DEFAULT_PRICE);
```

We're also working on a wrapper for the truffle/web3 contracts. Please let us know if you need a solution for other frameworks as well. 

### Alternative solutions

If you don't want to modify even a single line of your contract it's possible to use an alternative solution based on the [Proxy pattern](). This approach intercepts a transaction a proxy stage, extracts the price data and delegates the original transaction to your contract. Another advantage of the solution is allowing any contract (including 3rd party ones) to access the data. However, these benefits come at the cost of higher gas consumption. If you're interested in using this approach take a look at the contracts located in the [storage-based](https://github.com/redstone-finance/redstone-flash-storage/tree/price-aware/contracts/storage-based) folder and reach out to us if you need help setting up your environment.  

## Development and contributions


### Building the code

```
npm i 
```

### Running tests

```
npx hardhat test 
```
