// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {NTZSV2} from "./NTZSV2.sol";

contract NTZSV3 is NTZSV2 {
    function version() external pure returns (uint256) {
        return 3;
    }
}
