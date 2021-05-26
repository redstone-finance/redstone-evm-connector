pragma solidity ^0.8.0;


interface IPriceFeed {

    function getPrice(bytes32 symbol) external returns(uint256);

}
