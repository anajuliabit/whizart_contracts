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
import "./utils/IWhizartArtist.sol";

contract WhizartBox {
	IWhizartWorkshop public workshop;
	IWhizartArtist public artist;

	constructor(IWhizartWorkshop _workshop, IWhizartArtist _artist) {
		workshop = _workshop;
		artist = _artist;
	}

	function mint() external payable {
		uint256 mintPriceArtist = artist.getMintPrice();
		uint256 mintPriceWorkshop = workshop.getMintPrice();

		require(mintPriceArtist + mintPriceWorkshop == msg.value, "Wrong amount of BNB");
		uint8 rarity = 1;

		workshop.mintBox{ value: mintPriceWorkshop }(msg.sender, rarity);
		artist.mintBox{ value: mintPriceArtist }(msg.sender, rarity);
	}
}
