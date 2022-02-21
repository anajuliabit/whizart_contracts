/*
██     ██ ██   ██ ██ ███████  █████  ██████  ████████ 
██     ██ ██   ██ ██    ███  ██   ██ ██   ██    ██    
██  █  ██ ███████ ██   ███   ███████ ██████     ██    
██ ███ ██ ██   ██ ██  ███    ██   ██ ██   ██    ██    
 ███ ███  ██   ██ ██ ███████ ██   ██ ██   ██    ██    
                                                                                                      
In case of problems contact us - support@whizart.co
https://whizart.co/
*/

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "hardhat/console.sol";
import "./utils/IWhizartWorkshop.sol";

contract WhizartBox {
	IWhizartWorkshop public workshop;

	constructor(IWhizartWorkshop _workshop) {
		workshop = _workshop;
	}

	function mint() external payable {
		uint8 rarity = 1;
		workshop.mintBox{ value: msg.value }(msg.sender, rarity);
	}
}
