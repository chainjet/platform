// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import '@openzeppelin/contracts/access/Ownable.sol';

contract LongTaskMock is Ownable {
    uint256 public counter;

    event Incremented(uint256 counter);

    function run(uint256 _from, uint256 _to) external returns (uint256) {
        for (uint256 i = _from; i < _to; i++) {
            counter += 1;
        }
        emit Incremented(counter);
        return counter;
    }
}
