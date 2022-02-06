// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

contract Whitelist {
	event WhitelistChanged(address _address, bool old, bool update);
	event WhitelistStatusChanged(bool _old, bool _new);

	bool public whitelistActive;

	// @notice Mapping of address to whitelist status
	// @param address - unter any address to retrieve bool
	// @return bool - true/fale if they are on the whitelist
	mapping(address => bool) public whitelist;

	// @notice This adds addresses to the mapping whitelist
	// @param address[] _addresses - and array/list of addresses
	function _addWhitelistBatch(address[] memory _addresses) internal {
		for (uint256 i = 0; i < _addresses.length; i++) {
			_addWhitelist(_addresses[i]);
		}
	}

	// @notice This adds one address to the mapping whitelist
	// @param _address - an EOA address
	function _addWhitelist(address _address) internal {
		require(!whitelist[_address], "Already on Whitelist");
		bool old = whitelist[_address];
		whitelist[_address] = true;
		emit WhitelistChanged(_address, old, whitelist[_address]);
	}

	// @notice This removes addresses to the mapping whitelist
	// @param address[] _addresses - and array/list of addresses
	function _removeWhitelistBatch(address[] memory _addresses) internal {
		for (uint256 i = 0; i < _addresses.length; i++) {
			_removeWhitelist(_addresses[i]);
		}
	}

	// @notice This removes one address to the mapping whitelist
	// @param _address - an EOA address
	function _removeWhitelist(address _address) internal {
		require(whitelist[_address], "Already off Whitelist");
		bool old = whitelist[_address];
		whitelist[_address] = false;
		emit WhitelistChanged(_address, old, whitelist[_address]);
	}

	// @notice This will enable whitelist
	function _enableWhitelist() internal {
		bool old = whitelistActive;
		whitelistActive = true;
		emit WhitelistStatusChanged(old, whitelistActive);
	}

	// @notice This will disable whitelist
	function _disableWhitelist() internal {
		bool old = whitelistActive;
		whitelistActive = false;
		emit WhitelistStatusChanged(old, whitelistActive);
	}
}
