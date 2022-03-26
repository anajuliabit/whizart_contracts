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

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "./utils/Utils.sol";
import "hardhat/console.sol";
pragma solidity ^0.8.4;

contract WhizartPaint is
	ERC1155Upgradeable,
	PausableUpgradeable,
	AccessControlUpgradeable,
	ReentrancyGuardUpgradeable,
	UUPSUpgradeable
{
	bytes32 public constant MAINTENANCE_ROLE = keccak256("MAINTENANCE_ROLE");
	bytes32 public constant DEVELOPER_ROLE = keccak256("DEVELOPER_ROLE");
	bytes32 public constant STAFF_ROLE = keccak256("STAFF_ROLE");
	bytes32 public constant DESIGNER_ROLE = keccak256("DESIGNER_ROLE");

	uint256 private constant maskLast8Bits = uint256(0xff);
	uint256 private constant maskFirst248Bits = ~uint256(0xff);

	uint256 public constant ALL_TYPES = 0;
	uint256 public constant ROLL = 1;
	uint256 public constant PENCIL = 2;
	uint256 public constant Graphitti = 3;
	uint256 public constant BRUSH = 4;
	uint256 public constant FRESCO = 5;

	event MintRequested(address to, uint256 targetBlock, uint256 quantity, uint256 paintType);
	event TokenMinted(address indexed to, uint256 paintType);

	struct CreatePaintRequest {
		uint256 targetBlock;
		uint256 quantity;
		uint256 paint_type;
	}

	struct Recipient {
		address to;
		uint256 quantity;
	}

	mapping(address => CreatePaintRequest[]) public mintRequests;
	// Mapping from owner address to claimable token count.
	mapping(address => mapping(uint256 => uint256)) public claimableTokens;
	// Mapping from paint type to current index;
	mapping(uint256 => uint256) public currentIndex;

	uint256 public availablePaints;
	uint256 private mintAmount;
	bool public mintActive;
	uint256 private mintPrice;

	function initialize() public initializer {
		__ERC1155_init("https://whizart.co/api/paints/{id}/");
		__Pausable_init();
		__AccessControl_init();
		__UUPSUpgradeable_init();
		__ReentrancyGuard_init();

		_setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
		_setupRole(MAINTENANCE_ROLE, _msgSender());
		_setupRole(DEVELOPER_ROLE, _msgSender());
		_setupRole(STAFF_ROLE, _msgSender());
		_setupRole(DESIGNER_ROLE, _msgSender());

		mintActive = false;
	}

	function addClaimableTokens(Recipient[] memory recipients, uint256 paintType) external onlyRole(STAFF_ROLE) {
		for (uint256 i = 0; i < recipients.length; ++i) {
			claimableTokens[recipients[i].to][paintType] += recipients[i].quantity;
		}
	}

	function decreaseClaimableTokens(Recipient[] memory recipients, uint256 paintType) external onlyRole(STAFF_ROLE) {
		for (uint256 i = 0; i < recipients.length; ++i) {
			claimableTokens[recipients[i].to][paintType] -= recipients[i].quantity;
		}
	}

	function getClaimableTokens(address to) external view returns (uint256) {
		uint256 result;
		for (uint256 i = 0; i < availablePaints; ++i) {
			result += claimableTokens[to][i];
		}
		return result;
	}

	function claim() external {
		address to = msg.sender;
		mapping(uint256 => uint256) storage tokens = claimableTokens[to];

		for (uint256 index = 0; index < availablePaints; index++) {
			uint256 mintCount = tokens[index];
			if (mintCount == 0) {
				continue;
			}
			requestToken(to, mintCount, index);
			tokens[index] -= mintCount;
		}
	}

	function requestToken(
		address to,
		uint256 quantity,
		uint256 paintType
	) private {
		uint256 targetBlock = block.number + 1;
		mintRequests[to].push(CreatePaintRequest(targetBlock, quantity, paintType));
		emit MintRequested(to, targetBlock, quantity, paintType);
	}

	function processMintRequest() external {
		CreatePaintRequest[] storage requests = mintRequests[_msgSender()];

		for (uint256 i = requests.length; i > 0; --i) {
			uint256 targetBlock = requests[i - 1].targetBlock;
			require(block.number > targetBlock, "Target block not arrived");

			uint256 seed = uint256(blockhash(targetBlock));

			if (seed == 0) {
				targetBlock = (block.number & maskFirst248Bits) + (targetBlock & maskLast8Bits);

				if (targetBlock >= block.number) {
					targetBlock -= 256;
				}
				seed = uint256(blockhash(targetBlock));
			}

			createToken(seed, requests[i - 1].paint_type, requests[i - 1].quantity);
			requests.pop();
		}
	}

	function createToken(
		uint256 seed,
		uint256 paintType,
		uint256 quantity
	) internal {
		for (uint256 index = 1; index <= quantity; index++) {
			uint256 currentPaintType;
			if (paintType == ALL_TYPES) {
				uint256 randomType;
				(seed, randomType) = Utils.randomRange(uint256(keccak256(abi.encodePacked(seed, index))), 1, 5);
				currentPaintType = randomType;
			} else {
				currentPaintType = paintType;
			}

			address sender = _msgSender();
			_mint(sender, currentPaintType, 1, "");
			currentIndex[currentPaintType]++;
			emit TokenMinted(sender, paintType);
		}
	}

	/// @dev Apply whenNotPaused modifier and call base function
	function _beforeTokenTransfer(
		address operator,
		address from,
		address to,
		uint256[] memory ids,
		uint256[] memory amounts,
		bytes memory data
	) internal override whenNotPaused {
		ERC1155Upgradeable._beforeTokenTransfer(operator, from, to, ids, amounts, data);
	}

	function _authorizeUpgrade(address) internal override onlyRole(DEVELOPER_ROLE) {}

	/// @notice solidity required override for supportsInterface(bytes4)
	/// @param interfaceId - bytes4 id per interface or contract
	///  calculated by ERC165 standards automatically
	function supportsInterface(bytes4 interfaceId)
		public
		view
		override(ERC1155Upgradeable, AccessControlUpgradeable)
		returns (bool)
	{
		return super.supportsInterface(interfaceId);
	}
}
