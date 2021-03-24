pragma solidity ^0.7.0;


interface IPriceFeed {

    function getPrice(bytes32 symbol) external returns(uint256);

}
