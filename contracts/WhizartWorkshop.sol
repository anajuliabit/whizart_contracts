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

import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "./utils/Whitelist.sol";
import "./utils/IWhizartWorkshop.sol";
import "./utils/Utils.sol";
import "hardhat/console.sol";

contract WhizartWorkshop is
	Initializable,
	ERC721Upgradeable,
	PausableUpgradeable,
	AccessControlUpgradeable,
	ReentrancyGuardUpgradeable,
	UUPSUpgradeable,
	Whitelist,
	IWhizartWorkshop
{
	using CountersUpgradeable for CountersUpgradeable.Counter;
	CountersUpgradeable.Counter public idCounter;

	bytes32 public constant MAINTENANCE_ROLE = keccak256("MAINTENANCE_ROLE");
	bytes32 public constant DEVELOPER_ROLE = keccak256("DEVELOPER_ROLE");
	bytes32 public constant STAFF_ROLE = keccak256("STAFF_ROLE");
	bytes32 public constant DESIGNER_ROLE = keccak256("DESIGNER_ROLE");

	string public constant baseExtension = ".json";
	uint8 public constant ALL_RARITY = 0;
	uint256 private constant maskLast8Bits = uint256(0xff);
	uint256 private constant maskFirst248Bits = ~uint256(0xff);

	event BaseURIChanged(string _old, string _new);
	event MintActive(bool _old, bool _new);
	event MintAmountChanged(uint256 _old, uint256 _new);
	event MintRequested(address _to, uint256 _targetBlock);
	event SupplyAvailableChanged(uint256 _old, uint256 _new);
	event DropRateChanged(uint256[] _old, uint256[] _new);
	event PriceChanged(uint256 _old, uint256 _new);
	event PaymentReceived(address sender, uint256 amount);
	event TokenMinted(address indexed to, uint256 indexed tokenId);
	event Withdraw(address to, uint256 amount);

	struct Workshop {
		uint8 rarity;
		uint8 level;
	}

	struct CreateWorkshopRequest {
		uint256 targetBlock;
		uint8 rarity;
	}

	uint256[] private dropRate;

	string public baseURI;

	/// @notice Mapping from owner address to token ID's
	mapping(address => uint256[]) public tokenIds;

	/// @notice Mapping from ID to Workshop details
	mapping(uint256 => Workshop) public workshops;

	mapping(address => CreateWorkshopRequest[]) public mintRequests;

	uint256 private mintAmount;
	bool public mintActive;
	uint256 public mintPrice;
	uint256 public supplyAvailable;
	address public box;

	function initialize() public initializer {
		__ERC721_init("WhizArt Workshop", "WSHOP");
		__Pausable_init();
		__AccessControl_init();
		__UUPSUpgradeable_init();
		__ReentrancyGuard_init();

		_setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
		_setupRole(MAINTENANCE_ROLE, _msgSender());
		_setupRole(DEVELOPER_ROLE, _msgSender());
		_setupRole(STAFF_ROLE, _msgSender());
		_setupRole(DESIGNER_ROLE, _msgSender());

		baseURI = "https://metadata-whizart.s3.sa-east-1.amazonaws.com/metadata/workshops/";
		whitelistActive = true;
		// @TODO change to false when go to production
		mintActive = true;
		supplyAvailable = 10;
		mintAmount = 2;
		// keyHash = _keyHash;
		// @TODO change native token price when go to production
		mintPrice = 0.0001 * 10**18;
		dropRate = [700, 300, 100];
	}

	/// @dev Function to receive ether, msg.data must be empty
	receive() external payable {
		emit PaymentReceived(_msgSender(), msg.value);
	}

	/// @dev Function to receive ether, msg.data is not empty
	fallback() external payable {
		emit PaymentReceived(_msgSender(), msg.value);
	}

	/// @notice Mints a new random Workshop
	function mint() external payable override whenNotPaused nonReentrant {
		require(mintActive == true, "Mint is not available");
		require(msg.value == mintPrice, "Wrong amount of BNB");
		require(supplyAvailable > 0, "No Workshop available to mint");

		address to = _msgSender();
		if (whitelistActive) {
			require(whitelist[to] == true, "Not whitelisted");
			require(tokenIds[to].length + 1 <= mintAmount, "User buy limit reached");
		}

		requestToken(to, ALL_RARITY);
	}

	/// @notice Mints a new random Workshop
	function mintBox(address to, uint8 rarity) external payable override whenNotPaused nonReentrant {
		console.log("workshop", _msgSender());
		require(_msgSender() == box, "Only Box contract can mint box");
		require(mintActive == true, "Mint is not available");
		require(msg.value == mintPrice, "Wrong amount of BNB");
		require(supplyAvailable > 0, "No Workshop available to mint");

		if (whitelistActive) {
			require(whitelist[to] == true, "Not whitelisted");
			require(tokenIds[to].length + 1 <= mintAmount, "User buy limit reached");
		}

		requestToken(to, rarity);
	}

	/// @notice Function to transfer a token from one owner to another
	/// @param from address The address which the token is transferred from
	/// @param to address The address which the token is transferred to
	/// @param tokenId uint256 The token ID
	/// @dev transfer temporarily disabled
	function _transfer(
		address from,
		address to,
		uint256 tokenId
	) internal override whenNotPaused nonReentrant {
		require(false, "Temporarily disabled");
		ERC721Upgradeable._transfer(from, to, tokenId);
	}

	/// @notice Will return the token URI
	/// @param tokenId uint256 Token ID
	function tokenURI(uint256 tokenId) public view override returns (string memory) {
		require(_exists(tokenId), "Workshop doesn't exist");
		string memory id = StringsUpgradeable.toString(tokenId);
		return string(abi.encodePacked(_baseURI(), id, baseExtension));
	}

	/// @notice Will return current token supply
	function totalSupply() external view returns (uint256) {
		return idCounter.current();
	}

	/// @notice This function will returns an Workshop array from a specific address
	/// @param _owner address The address to get the workshops from
	function getTokenDetailsByOwner(address _owner) external view returns (Workshop[] memory) {
		uint256[] storage ids = tokenIds[_owner];
		Workshop[] memory result = new Workshop[](ids.length);
		for (uint256 i = 0; i < ids.length; ++i) {
			result[i] = workshops[ids[i]];
		}
		return result;
	}

	function getDropRate() external view returns (uint256[] memory) {
		return dropRate;
	}

	/*
	This section has all functions available only for STAFF_ROLE
*/

	/// @notice This will enable whitelist or "if" in mint()
	function enableWhitelist() external onlyRole(STAFF_ROLE) {
		_enableWhitelist();
	}

	/// @notice This will disable whitelist
	function disableWhitelist() external onlyRole(STAFF_ROLE) {
		_disableWhitelist();
	}

	/// @notice adding an array/list of addresses to whitelist
	///  uses internal function _addWhitelistBatch(address [] memory _addresses)
	/// of Whitelist.sol to accomplish, will revert if duplicates exist in list
	///  or array of addresses.
	/// @param _addresses - list/array of addresses
	function addWhitelistBatch(address[] memory _addresses) external onlyRole(STAFF_ROLE) {
		_addWhitelistBatch(_addresses);
	}

	/// @notice adding one address to whitelist uses internal function
	///  _addWhitelist(address _address) of Whitelist.sol to accomplish,
	///  will revert if duplicates exists
	/// @param _address - address
	function addWhitelist(address _address) external onlyRole(STAFF_ROLE) {
		_addWhitelist(_address);
	}

	/// @notice Removing an array/list of addresses from whitelist
	///  uses internal function _removeWhitelistBatch(address [] memory _addresses)
	///  of Whitelist.sol to accomplish, will revert if duplicates exist in list
	///  or array of addresses
	/// @param _addresses - list/array of addresses
	function removeWhitelistBatch(address[] memory _addresses) external onlyRole(STAFF_ROLE) {
		_removeWhitelistBatch(_addresses);
	}

	/// @notice Removing one address to whitelist uses internal function
	///  _removeWhitelist(address _address) of Whitelist.sol to accomplish,
	///  will revert if duplicates exists
	/// @param _address - address
	function removeWhitelist(address _address) external onlyRole(STAFF_ROLE) {
		_removeWhitelist(_address);
	}

	function enableMint() external onlyRole(STAFF_ROLE) {
		bool old = mintActive;
		mintActive = true;
		emit MintActive(old, mintActive);
	}

	function disableMint() external onlyRole(STAFF_ROLE) {
		bool old = mintActive;
		mintActive = false;
		emit MintActive(old, mintActive);
	}

	/*
	This section has all functions available only for DESIGNER_ROLE
	*/

	function setDropRate(uint256[] memory value) external onlyRole(DESIGNER_ROLE) {
		uint256[] memory old = dropRate;
		dropRate = value;
		emit DropRateChanged(old, value);
	}

	/*
	This section has all functions available only for DEFAULT_ADMIN_ROLE
	*/

	function setMintPrice(uint256 value) external onlyRole(DEFAULT_ADMIN_ROLE) {
		uint256 old = mintPrice;
		mintPrice = value;
		emit PriceChanged(old, mintPrice);
	}

	function setMintAmount(uint256 _mintAmount) external onlyRole(DEFAULT_ADMIN_ROLE) {
		uint256 old = mintAmount;
		mintAmount = _mintAmount;
		emit MintAmountChanged(old, mintAmount);
	}

	function setSupplyAvailable(uint256 _supplyAvailable) external onlyRole(DEFAULT_ADMIN_ROLE) {
		uint256 old = supplyAvailable;
		supplyAvailable = _supplyAvailable;
		emit SupplyAvailableChanged(old, supplyAvailable);
	}

	function setBaseURI(string memory _newBaseURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
		string memory old = baseURI;
		baseURI = _newBaseURI;
		emit BaseURIChanged(old, baseURI);
	}

	function setBoxyContract(address _contract) external onlyRole(DEFAULT_ADMIN_ROLE) {
		box = _contract;
	}

	function withdraw(address _to, uint256 _amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
		require(address(this).balance >= _amount, "Invalid amount");
		payable(_to).transfer(_amount);
		emit Withdraw(_to, _amount);
	}

	/// @notice function useful for accidental ETH transfers to contract (to user address)
	/// wraps _user in payable to fix address -> address payable
	/// @param _user - user address to input
	/// @param _amount - amount of ETH to transfer
	function sweepEthToAddress(address _user, uint256 _amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
		payable(_user).transfer(_amount);
	}

	/*
	This section has all functions available only for MAINTENANCE_ROLE
*/
	function pause() external onlyRole(MAINTENANCE_ROLE) returns (bool) {
		_pause();
		return true;
	}

	function unpause() external onlyRole(MAINTENANCE_ROLE) returns (bool) {
		_unpause();
		return true;
	}

	/*
	Internal and private functions
*/

	function requestToken(address to, uint8 rarity) internal {
		uint256 targetBlock = block.number + 1;
		mintRequests[to].push(CreateWorkshopRequest(targetBlock, rarity));
		emit MintRequested(to, targetBlock);
	}

	function processMintRequest() external {
		CreateWorkshopRequest[] storage requests = mintRequests[_msgSender()];
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

			createToken(seed, requests[i - 1].rarity);
			requests.pop();
		}
	}

	function createToken(uint256 seed, uint8 rarity) internal {
		uint256 id = idCounter.current();
		idCounter.increment();
		--supplyAvailable;

		if (rarity == ALL_RARITY) {
			(, uint256 index) = Utils.weightedRandom(seed, dropRate);
			rarity = uint8(index);
		}

		Workshop memory workshop = Workshop(uint8(rarity), 1);

		address sender = _msgSender();
		_safeMint(sender, id);

		workshops[id] = workshop;
		tokenIds[sender].push(id);
		emit TokenMinted(sender, id);
	}

	// @TODO
	/// @notice solidity required override for supportsInterface(bytes4)
	/// @param interfaceId - bytes4 id per interface or contract
	///  calculated by ERC165 standards automatically
	function supportsInterface(bytes4 interfaceId)
		public
		view
		override(ERC721Upgradeable, AccessControlUpgradeable)
		returns (bool)
	{
		return super.supportsInterface(interfaceId);
	}

	/// @dev Apply whenNotPaused modifier and call base function
	function _beforeTokenTransfer(
		address from,
		address to,
		uint256 tokenId
	) internal override whenNotPaused {
		ERC721Upgradeable._beforeTokenTransfer(from, to, tokenId);
	}

	function _baseURI() internal view override returns (string memory) {
		return baseURI;
	}

	function _authorizeUpgrade(address) internal override onlyRole(DEVELOPER_ROLE) {}
}
