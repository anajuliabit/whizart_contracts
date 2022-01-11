// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import 'hardhat/console.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol';
import '@openzeppelin/contracts/access/AccessControlEnumerable.sol';
import '@openzeppelin/contracts/utils/Context.sol';

contract WhizArt is Context, ERC20, ERC20Burnable, ERC20Pausable, AccessControl {
  bytes32 public constant PAUSER_ROLE = keccak256('PAUSER_ROLE');

  constructor(address owner) ERC20('WhizArt', 'WHIZ') {
    _setupRole(DEFAULT_ADMIN_ROLE, owner);
    _setupRole(PAUSER_ROLE, owner);
    _mint(owner, 100000000 * 10**decimals());
  }

  function pause() public onlyRole(PAUSER_ROLE) {
    _pause();
  }

  function unpause() public onlyRole(PAUSER_ROLE) {
    _unpause();
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal override(ERC20, ERC20Pausable) whenNotPaused {
    super._beforeTokenTransfer(from, to, amount);
  }
}
