// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import '@openzeppelin/contracts/access/Ownable.sol';

contract TaskMock is Ownable {
    uint256 public counter;

    event Incremented(uint256 counter);

    function run(uint256 _inc) external {
        counter += _inc;
        emit Incremented(counter);
    }
}
