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
import "./utils/VRFConsumerBaseUpgradeable.sol";

contract WhizartWorkshop is
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
	CountersUpgradeable.Counter public idCounter;

	string public constant baseExtension = ".json";
	bytes32 public constant MAINTENANCE_ROLE = keccak256("MAINTENANCE_ROLE");
	bytes32 public constant DEVELOPER_ROLE = keccak256("DEVELOPER_ROLE");
	bytes32 public constant STAFF_ROLE = keccak256("STAFF_ROLE");

	event WorkshopMinted(bytes32 indexed requestId, address indexed to, uint256 indexed tokenId);
	event PriceChanged(uint256 _old, uint256 _new);
	event PaymentReceived(address sender, uint256 amount);
	event BaseURIChanged(string _old, string _new);
	event MintActive(bool _old, bool _new);
	event MintAmountChanged(uint256 _old, uint256 _new);
	event SupplyAvailableChanged(uint256 _old, uint256 _new);
	event Withdraw(address to, uint256 amount);
	event CalledRandomGenerator(bytes32 requestId);

	enum Rarity {
		COMMON,
		RARE,
		LEGENDARY
	}

	struct Workshop {
		Rarity rarity;
		uint8 level;
	}

	string public baseURI;

	/// @notice Mapping from owner address to token ID's
	mapping(address => uint256[]) public tokenIds;

	/// @notice Mapping from ID to Artist details
	mapping(uint256 => Workshop) public workshops;

	mapping(Rarity => string[]) public notMintedURIs;

	// @TODO delete this
	mapping(uint256 => string) private tokenURIs;

/// @dev Chainlink VRF variables
	bytes32 private keyHash;
	uint256 private fee;
	mapping(bytes32 => address) private requestToSender;
	mapping(bytes32 => uint256) private requestToTokenId;

	uint256 private mintAmount;
	bool public mintActive;
	uint256 public mintPrice;
	uint256 public supplyAvailable;

	function initialize(
		address vrfCoordinator,
		address linkToken,
		bytes32 _keyHash
	) public initializer {
		__ERC721_init("WhizArt Workshop", "WSHOP");
		__VRFConsumerBase_init(vrfCoordinator, linkToken);
		__Pausable_init();
		__AccessControl_init();
		__UUPSUpgradeable_init();
		__ReentrancyGuard_init();

		_setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
		_setupRole(MAINTENANCE_ROLE, _msgSender());
		_setupRole(DEVELOPER_ROLE, _msgSender());
		_setupRole(STAFF_ROLE, _msgSender());

		baseURI = "https://metadata-whizart.s3.sa-east-1.amazonaws.com/metadata/workshops/";
		whitelistActive = true;
		// @TODO change to false when go to production
		mintActive = true;
		supplyAvailable = 10;
		mintAmount = 2;
		keyHash = _keyHash;
		// @TODO change native token price when go to production
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

	/// @notice Mints a new random Workshop
	/// This function call chainlink VRF to generate a random Workshop
	/// Workshops will only appear in your wallet after VRF callback transaction is confirmed, so please wait a minutes to check
	function mint() external payable whenNotPaused nonReentrant {
		require(mintActive == true, "Mint is not available");
		require(msg.value == mintPrice, "Wrong amount of MATIC");
		uint256 id = idCounter.current();

		require(id + 1 < supplyAvailable, "No Workshop available to mint");

		address to = _msgSender();
		if (whitelistActive) {
			require(whitelist[to] == true, "Not whitelisted");
			require(tokenIds[to].length + 1 <= mintAmount, "User buy limit reached");
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
		string memory id = StringsUpgradeable.toString(tokenId);
		return string(abi.encodePacked(_baseURI(), id, baseExtension));
	}

	/// @notice Will return current token supply
	function totalSupply() external view returns (uint256) {
		return idCounter.current();
	}

	/// @notice This function will returns an Artist array from a specific address
	/// @param _owner address The address to get the artists from
	function getTokenDetailsByOwner(address _owner) external view returns (Workshop[] memory) {
		uint256[] storage ids = tokenIds[_owner];
		Workshop[] memory result = new Workshop[](ids.length);
		for (uint256 i = 0; i < ids.length; ++i) {
			result[i] = workshops[ids[i]];
		}
		return result;
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
	This section has all functions available only for DEFAULT_ADMIN_ROLE
*/

	function setMintPrice(uint256 value) external onlyRole(DEFAULT_ADMIN_ROLE) {
		uint256 old = mintPrice;
		mintPrice = value;
		emit PriceChanged(old, mintPrice);
	}

	function changeMintAmount(uint256 _mintAmount) external onlyRole(DEFAULT_ADMIN_ROLE) {
		uint256 old = mintAmount;
		mintAmount = _mintAmount;
		emit MintAmountChanged(old, mintAmount);
	}

	function changeSupplyAvailable(uint256 _supplyAvailable) external onlyRole(DEFAULT_ADMIN_ROLE) {
		uint256 old = supplyAvailable;
		supplyAvailable = _supplyAvailable;
		emit SupplyAvailableChanged(old, supplyAvailable);
	}

	function changeBaseURI(string memory _newBaseURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
		string memory old = baseURI;
		baseURI = _newBaseURI;
		emit BaseURIChanged(old, baseURI);
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

	/// @dev Function to request RNG from chainlink VRF
	function requestRandomToken(address to) private {
		require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK");
		uint256 id = idCounter.current();
		idCounter.increment();
		bytes32 requestId = requestRandomness(keyHash, fee);
		requestToSender[requestId] = to;
		requestToTokenId[requestId] = id;
		emit CalledRandomGenerator(requestId);
	}

	/// @dev Function to receive VRF callback, generate random properties and mint Artist
	function fulfillRandomness(bytes32 requestId, uint256 randomNumber) internal override {
		Rarity rarity = Rarity(((randomNumber % 100) * 3) / 100);

		uint256 index = ((randomNumber % 1000) * notMintedURIs[rarity].length) / 1000;
		string memory uri = notMintedURIs[rarity][index];
		removeURI(index, rarity);
		(index, rarity);

		Workshop memory workshop = Workshop(rarity, 1);

		uint256 id = requestToTokenId[requestId];
		address sender = requestToSender[requestId];
		_safeMint(sender, id);
		
		workshops[id] = workshop;
		tokenIds[sender].push(id);
		tokenURIs[id] = uri;	
		emit WorkshopMinted(requestId, sender, id);
	}

// @dev Removes URI from notMintedURIs
	function removeURI(uint256 index, Rarity rarity) private {
		string[] storage array = notMintedURIs[rarity];
		require(index < array.length);

		array[index] = array[array.length - 1];
		array.pop();

		notMintedURIs[rarity] = array;
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
