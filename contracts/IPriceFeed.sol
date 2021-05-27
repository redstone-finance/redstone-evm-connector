// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;


interface IPriceFeed {

    function getPrice(bytes32 symbol) external returns(uint256);

}
