// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "./utils/VRFConsumerBaseUpgradeable.sol";
import "./utils/Whitelist.sol";
import "hardhat/console.sol";

contract WArtist is
	Initializable,
	ERC721Upgradeable,
	PausableUpgradeable,
	AccessControlUpgradeable,
	ReentrancyGuardUpgradeable,
	UUPSUpgradeable,
	VRFConsumerBaseUpgradeable,
	Whitelist
{
	using CountersUpgradeable for CountersUpgradeable.Counter;

	bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
	bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
	bytes32 public constant DESIGNER_ROLE = keccak256("DESIGNER_ROLE");
	bytes32 public constant BACKEND_ROLE = keccak256("BACKEND_ROLE");

	event ArtistMinted(bytes32 indexed requestId, address indexed to, uint256 indexed tokenId);
	event PriceChanged(uint256 _old, uint256 _new);
	event PaymentReceived(address sender, uint256 amount);
	event BaseURIChanged(string _old, string _new);
	event MintActive(bool _old, bool _new);
	event MintSizeChanged(uint256 _old, uint256 _new);
	event SupplyAvailableChanged(uint256 _old, uint256 _new);
	event CalledRandomGenerator(bytes32 requestId);

	enum Rarity {
		NOVICE,
		APPRENTICE,
		JOURNEYMAN,
		MASTER,
		GRANDMASTER
	}

	enum PaintType {
		GRAPHITTI,
		ACRILIC,
		INK,
		FRESCO,
		WATER_COLOR
	}

	struct Artist {
		Rarity rarity;
		PaintType paintType;
		// Initial level: 1, Max level: 10
		uint8 creativity;
		// Max: 6
		uint8 colorSlots;
	}

	CountersUpgradeable.Counter public idCounter;
	string public baseURI;

	/// @notice Mapping from owner address to token ID
	mapping(address => uint256[]) public tokenIds;

	/// @notice Mapping from token ID to token details
	mapping(uint256 => Artist) public artists;

	mapping(uint256 => string) private tokenURIs;

	/// @notice URI's available of artists of each rarity
	mapping(Rarity => string[]) public artistsURIByRarity;

	// Chainlink VRF variables
	bytes32 private keyHash;
	uint256 private fee;
	mapping(bytes32 => address) private requestToSender;
	mapping(bytes32 => uint256) private requestToTokenId;

	uint256 private mintSize;
	bool public mintActive;
	uint256 public mintPrice;
	uint256 public supplyAvailable;

	function initialize(
		address vrfCoordinator,
		address linkToken,
		bytes32 _keyHash
	) public initializer {
		__ERC721_init("Whizart Artist", "WArtist");
		__VRFConsumerBase_init(vrfCoordinator, linkToken);
		__Pausable_init();
		__AccessControl_init();
		__UUPSUpgradeable_init();
		__ReentrancyGuard_init();

		_setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
		_setupRole(PAUSER_ROLE, _msgSender());
		_setupRole(UPGRADER_ROLE, _msgSender());
		_setupRole(DESIGNER_ROLE, _msgSender());
		_setupRole(BACKEND_ROLE, _msgSender());

		baseURI = "ipfs://";
		keyHash = _keyHash;
		// @TODO set fee
		fee = 0.1 * 10**18;
		whitelistActive = true;
		mintActive = true;
		supplyAvailable = 4000;
		mintSize = 2;
		// @TODO set native token price
		mintPrice = 0.0001 * 10**18;
	}

	/// @dev Function to receive ether, msg.data must be empty
	receive() external payable {
		emit PaymentReceived(_msgSender(), msg.value);
	}

	/// @dev Function to receive ether, msg.data is not empty
	fallback() external payable {
		emit PaymentReceived(_msgSender(), msg.value);
	}

	/// @notice Mints a new random artist
	/// To run this function its necessary has approved the contract address spend DAI
	/// This function call chainlink VRF to generate a random artist
	/// Artist will only appear in your wallet after VRF callback transaction is confirmed, so please wait a minutes to check
	function publicMint() external payable whenNotPaused nonReentrant {
		require(mintActive == true, "Mint is not available");
		require(idCounter.current() + 1 <= supplyAvailable, "No token available to mint");
		require(msg.value == mintPrice, "Wrong amount of native token");

		address to = _msgSender();
		if (whitelistActive) {
			require(whitelist[to] == true, "Not whitelisted");
			require(tokenIds[to].length + 1 <= mintSize, "User buy limit reached");
		}
		requestRandomToken(to);
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
		require(_exists(tokenId), "Artist doesn't exist");

		return string(abi.encodePacked(_baseURI(), tokenURIs[tokenId]));
	}

	/// @notice Will return current token count
	function totalSupply() external view returns (uint256) {
		return idCounter.current();
	}

	/// @notice Method that returns an Artist array from a specific address
	function getTokenDetailsByOwner(address _owner) external view returns (Artist[] memory) {
		uint256[] storage ids = tokenIds[_owner];
		Artist[] memory result = new Artist[](ids.length);
		for (uint256 i = 0; i < ids.length; ++i) {
			result[i] = artists[ids[i]];
		}
		return result;
	}

	function _baseURI() internal view override returns (string memory) {
		return baseURI;
	}

	function addURIAvailables(Rarity rarity, string[] memory uris) external onlyRole(BACKEND_ROLE) {
		for (uint256 i = 0; i < uris.length; i++) {
			addURIAvailable(rarity, uris[i]);
		}
	}

	function addURIAvailable(Rarity rarity, string memory value) public onlyRole(BACKEND_ROLE) {
		artistsURIByRarity[rarity].push(value);
	}

	/// @notice This will enable whitelist or "if" in publicMint()
	function enableWhitelist() external onlyRole(BACKEND_ROLE) {
		_enableWhitelist();
	}

	/// @notice This will disable whitelist
	function disableWhitelist() external onlyRole(BACKEND_ROLE) {
		_disableWhitelist();
	}

	/// @notice adding an array/list of addresses to whitelist
	///  uses internal function _addWhitelistBatch(address [] memory _addresses)
	/// of Whitelist.sol to accomplish, will revert if duplicates exist in list
	///  or array of addresses.
	/// @param _addresses - list/array of addresses
	function addWhitelistBatch(address[] memory _addresses) external onlyRole(BACKEND_ROLE) {
		_addWhitelistBatch(_addresses);
	}

	/// @notice adding one address to whitelist uses internal function
	///  _addWhitelist(address _address) of Whitelist.sol to accomplish,
	///  will revert if duplicates exists
	/// @param _address - address
	function addWhitelist(address _address) external onlyRole(BACKEND_ROLE) {
		_addWhitelist(_address);
	}

	/// @notice Removing an array/list of addresses from whitelist
	///  uses internal function _removeWhitelistBatch(address [] memory _addresses)
	///  of Whitelist.sol to accomplish, will revert if duplicates exist in list
	///  or array of addresses
	/// @param _addresses - list/array of addresses
	function removeWhitelistBatch(address[] memory _addresses) external onlyRole(BACKEND_ROLE) {
		_removeWhitelistBatch(_addresses);
	}

	/// @notice Removing one address to whitelist uses internal function
	///  _removeWhitelist(address _address) of Whitelist.sol to accomplish,
	///  will revert if duplicates exists
	/// @param _address - address
	function removeWhitelist(address _address) external onlyRole(BACKEND_ROLE) {
		_removeWhitelist(_address);
	}

	function enableMint() external onlyRole(BACKEND_ROLE) {
		bool old = mintActive;
		mintActive = true;
		emit MintActive(old, mintActive);
	}

	function disableMint() external onlyRole(BACKEND_ROLE) {
		bool old = mintActive;
		mintActive = false;
		emit MintActive(old, mintActive);
	}

	function setMintCost(uint256 value) external onlyRole(DEFAULT_ADMIN_ROLE) {
		uint256 old = mintPrice;
		mintPrice = value;
		emit PriceChanged(old, mintPrice);
	}

	function changeMintSize(uint256 _mintSize) external onlyRole(DEFAULT_ADMIN_ROLE) {
		uint256 old = mintSize;
		mintSize = _mintSize;
		emit MintSizeChanged(old, mintSize);
	}

	function changeSupplyAvailable(uint256 _supplyAvailable) external onlyRole(DEFAULT_ADMIN_ROLE) {
		uint256 old = supplyAvailable;
		supplyAvailable = _supplyAvailable;
		emit SupplyAvailableChanged(old, supplyAvailable);
	}

	// @TODO
	// @notice this will use internal functions to set EIP 2981
	//  found in IERC2981.sol and used by ERC2981Collections.sol
	// @param address _royaltyAddress - Address for all royalties to go to
	// @param uint256 _percentage - Precentage in whole number of comission
	//  of secondary sales
	// function setRoyaltyInfo(address _royaltyAddress, uint256 _percentage) public onlyRole(DEFAULT_ADMIN_ROLE) {
	// 	_setRoyalti√es(_royaltyAddress, _percentage);
	// 	emit UpdatedRoyalties(_royaltyAddress, _percentage);
	// }

	function changeBaseURI(string memory _newBaseURI) external onlyRole(DEFAULT_ADMIN_ROLE) returns (bool) {
		string memory old = baseURI;
		baseURI = _newBaseURI;
		emit BaseURIChanged(old, baseURI);
		return true;
	}

	/// @notice function useful for accidental ETH transfers to contract (to user address)
	/// wraps _user in payable to fix address -> address payable
	/// @param _user - user address to input
	/// @param _amount - amount of ETH to transfer
	function sweepEthToAddress(address _user, uint256 _amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
		payable(_user).transfer(_amount);
	}

	function pauseContract() external onlyRole(PAUSER_ROLE) returns (bool) {
		_pause();
		return true;
	}

	function unpauseContract() external onlyRole(PAUSER_ROLE) returns (bool) {
		_unpause();
		return true;
	}

	function _authorizeUpgrade(address) internal override onlyRole(UPGRADER_ROLE) {}

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

	/// @dev Function to request RNG from chainlink VRF
	function requestRandomToken(address to) private {
		require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK");
		uint256 id = idCounter.current();
		bytes32 requestId = requestRandomness(keyHash, fee);

		idCounter.increment();
		requestToSender[requestId] = to;
		requestToTokenId[requestId] = id;
		emit CalledRandomGenerator(requestId);
	}

	/// @dev Function to receive VRF callback, generate random properties and mint Artist
	function fulfillRandomness(bytes32 requestId, uint256 randomNumber) internal override {
		Rarity rarity = Rarity(((randomNumber % 100) * 5) / 100);

		// Test what you happen's if some other call update the artistSupplyByRarity while this call read from storage?
		uint256 index = ((randomNumber % 1000) * artistsURIByRarity[rarity].length) / 1000;
		string memory uri = artistsURIByRarity[rarity][index];
		removeMintedURI(index, rarity);

		Artist memory artist = Artist(rarity, PaintType(((randomNumber % 10000) * 5) / 10000 + 1), 1, 2);

		uint256 id = requestToTokenId[requestId];
		address sender = requestToSender[requestId];
		_safeMint(sender, id);
		artists[id] = artist;
		tokenIds[sender].push(id);
		tokenURIs[id] = uri;

		emit ArtistMinted(requestId, sender, id);
	}

	function removeMintedURI(uint256 index, Rarity rarity) private {
		string[] storage array = artistsURIByRarity[rarity];

		require(index < array.length);
		array[index] = array[array.length - 1];
		array.pop();

		artistsURIByRarity[rarity] = array;
	}

	/// @dev Apply whenNotPaused modifier and call base function
	function _beforeTokenTransfer(
		address from,
		address to,
		uint256 tokenId
	) internal override whenNotPaused {
		ERC721Upgradeable._beforeTokenTransfer(from, to, tokenId);
	}
}
