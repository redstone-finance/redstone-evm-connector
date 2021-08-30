# Flash storage

Putting data directly into storage is the easiest to make information accessible to smart contracts. However, the convenience comes at a high price, as the storage access is the most costly operation in [EVM](https://ethereum.github.io/yellowpaper/paper.pdf) (20k gas for 256bit word ~ $160k for 1Mb checked 30/08/2021) making it prohibitively expensive to use.

Flash storage implements an alternative design of providing data to smart contracts. Instead of constantly persisting data on EVM storage, the information is brought on-chain only when needed (**on-demand fetching**). Until that moment, the data remains available in the [Arweave](https://www.arweave.org/) blockchain where data providers are incentivised to keep information accurate and up to date. Data is transferred to EVM via a mechanism based on a [meta-transaction pattern](https://medium.com/@austin_48503/ethereum-meta-transactions-90ccf0859e84) and the information integrity is verified on-chain through signature checking. 



## How it works


## Getting started

### 1. Modifying your contracts

In order to enable smart contract to access data you need to apply a miniam change to the source code. Your contract needs to extend the [PriceAware](https://github.com/redstone-finance/redstone-flash-storage/blob/price-aware/contracts/message-based/PriceAwareAsm.sol) contract :

```
contract YourContractName is PriceAwareAsm {
```

After applying the mentioned change you will be able to access the data calling the local [getPriceFromMsg](https://github.com/redstone-finance/redstone-flash-storage/blob/price-aware/contracts/message-based/PriceAwareAsm.sol#L29) function:

```
uint256 ethPrice = getPriceFromMsg(bytes32("ETH"));
```

### 2. Updating the interface

You should also update the code responsible for sending transactions. If you're using [ethers.js](https://github.com/ethers-io/ethers.js/), we've prepared a convenient library to make the transition seamless. First, you need to import the wrapper code to your project:

```
contract YourContractName is PriceAwareAsm {
```

Then you can wrap your ethers contract pointing to the selected Redstone data provider:

```
contract YourContractName is PriceAwareAsm {
```

Now you can access any of the contract's methods in exactly the same way as interacting with the ethers-js code:

```
contract YourContractName is PriceAwareAsm {
```

If you're the owner of the contract, the wrapper offers you also a convenient method to authorise a provider without the need of passing address (the provider authenticity will be checked via signature verification whenever a user submits a transaction accessing the data):

```
contract YourContractName is PriceAwareAsm {
```

If you'd like to use the wrapper in a test context, we recommend using a mock provider when you can easily override the price to test different scenarios:


```
contract YourContractName is PriceAwareAsm {
```



We're also working on a wrapper for the truffle/web3 contracts. Please let us know if you need a solution for other frameworks as well. 

### Alternative solutions


## Development and contributions


### Building the code

```
npm i 
```

### Running tests

```
npx hardhat test 
```
