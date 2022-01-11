// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
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
import "@openzeppelin/contracts/utils/Counters.sol";
import "./utils/VRFConsumerBaseUpgradeable.sol";

contract WArtist is
	Initializable,
	ERC721Upgradeable,
	PausableUpgradeable,
	AccessControlUpgradeable,
	ReentrancyGuardUpgradeable,
	UUPSUpgradeable,
	VRFConsumerBaseUpgradeable
{
	using SafeMathUpgradeable for uint256;
	using SafeERC20Upgradeable for IERC20Upgradeable;
	using Counters for Counters.Counter;

	bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
	bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
	bytes32 public constant DESIGNER_ROLE = keccak256("DESIGNER_ROLE");
	bytes32 public constant BACKEND_ROLE = keccak256("BACKEND_ROLE");

	event ArtistMinted(bytes32 indexed requestId, address indexed to, uint256 indexed tokenId);
	event PriceChanged(uint256 indexed price);
	event BodyPartAdded(BodyPart bodyPart);

	Counters.Counter public idCounter;
	string public baseURI;
	address public treasuryWallet;

	enum BodyCategory {
		ARM,
		EYE,
		HAIR,
		HEAD,
		MOUTH,
		OUTFIT,
		SOUL
	}

	struct BodyPart {
		uint16 id;
		string name;
		uint16 rarity;
		BodyCategory category;
	}

	mapping(uint16 => BodyPart) public bodyParts;
	mapping(uint256 => uint16) private bodyPartCounts;

	struct Body {
		uint16 arm;
		uint16 eye;
		uint16 mouth;
		uint16 hair;
		uint16 head;
		uint16 outfit;
		uint16 soul;
	}

	struct Artist {
		uint256 id;
		// Varies from 1 to 5, body part media
		uint8 totalRarity;
		// Initial level: 1, Max level: 10
		uint8 creativity;
		// Varies from 1 to 5
		uint8 paintPreference;
		// Max: 6
		uint8 colorSlots;
		Body body;
	}

	// Mapping from owner address to token ID.
	mapping(address => uint256[]) public tokenIds;

	// Mapping from token ID to token details.
	mapping(uint256 => Artist) public artists;

	// Chainlink VRF variables
	bytes32 private keyHash;
	uint256 private fee;

	mapping(bytes32 => address) private requestToSender;
	mapping(bytes32 => uint256) private requestToTokenId;
	mapping(bytes32 => Artist) private requestToArtist;

	//@TODO change to IERC20Upgradeable if uses DAI on Polygon
	IERC20 public stableCoin;

	uint256 public mintStableCost;
	uint16 public supplyAvailablePresale;
	bool public whitelistActive;
	uint8 private preSaleLimit;
	mapping(address => bool) public whitelist;

	uint256 public randomNumberGenerated;

	function initialize(
		address _treasureWallet,
		address vrfCoordinator,
		address linkToken,
		bytes32 _keyHash,
		address stableCoinAddress
	) public initializer {
		__ERC721_init("Whizart Artist", "WArtist");
		__VRFConsumerBase_init(vrfCoordinator, linkToken);
		__Pausable_init();
		__AccessControl_init();
		__UUPSUpgradeable_init();

		_setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
		_setupRole(PAUSER_ROLE, msg.sender);
		_setupRole(UPGRADER_ROLE, msg.sender);
		_setupRole(DESIGNER_ROLE, msg.sender);
		_setupRole(BACKEND_ROLE, msg.sender);

		baseURI = "https://api.whizart.co/metadata/";
		whitelistActive = true;
		supplyAvailablePresale = 4000;
		treasuryWallet = _treasureWallet;
		preSaleLimit = 2;
		mintStableCost = 500 * 10**18;
		keyHash = _keyHash;
		fee = 0.1 * 10**18; // 0.1 LINK
		//@TODO change to IERC20Upgradeable if uses DAI on Polygon
		stableCoin = IERC20(stableCoinAddress);
		// _pause();
	}

	function mintWhitelist(uint256 amount) external whenNotPaused nonReentrant returns (bool) {
		require(whitelistActive == true, "Whitelist is not active");
		require(supplyAvailablePresale > 0, "All presale Artists are sold");
		address to = msg.sender;
		require(whitelist[to] == true, "Not whitelisted");
		require(tokenIds[to].length + 1 <= preSaleLimit, "User buy limit reached");
		uint256 allowance = stableCoin.allowance(msg.sender, address(this));
		require(allowance >= amount, "Check the token allowance");
		require(stableCoin.balanceOf(msg.sender) >= mintStableCost, "Insuficient funds");

		supplyAvailablePresale = supplyAvailablePresale - 1;
		stableCoin.transferFrom(to, treasuryWallet, mintStableCost);

		requestRandomToken(to);
		return true;
	}

	function getTokenDetailsByOwner(address _owner) external view returns (Artist[] memory) {
		uint256[] storage ids = tokenIds[_owner];
		Artist[] memory result = new Artist[](ids.length);
		for (uint256 i = 0; i < ids.length; ++i) {
			result[i] = artists[ids[i]];
		}
		return result;
	}

	function requestRandomToken(address to) internal returns (bytes32) {
		require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK");
		uint256 id = idCounter.current();
		idCounter.increment();
		bytes32 requestId = requestRandomness(keyHash, fee);

		requestToSender[requestId] = to;
		requestToTokenId[requestId] = id;
		return requestId;
	}

	function fulfillRandomness(bytes32 requestId, uint256 randomNumber) internal override {
		randomNumberGenerated = randomNumber;
		uint8 creativity = uint8((randomNumber.mod(10000)).mod(10));
		uint8 paintType = uint8((randomNumber.mod(1000000)).mod(5));
		Body memory body = generateBodyByRandom(randomNumber);

		uint8 totalRarity = uint8(
			body.arm + body.eye + body.hair + body.head + body.mouth + body.outfit + body.soul / 7
		);
		uint256 id = requestToTokenId[requestId];

		Artist memory artist = Artist(id, totalRarity, creativity, paintType, 2, body);
		artists[id] = artist;
		address sender = requestToSender[requestId];
		_safeMint(sender, id);

		emit ArtistMinted(requestId, sender, id);
	}

	function generateBodyByRandom(uint256 randomNumber) internal view returns (Body memory) {
		return
			Body(
				uint8((randomNumber.mod(10000000000)).mod(bodyPartCounts[uint8(BodyCategory.ARM)])),
				uint8((randomNumber.mod(10000000000)).mod(bodyPartCounts[uint8(BodyCategory.EYE)])),
				uint8((randomNumber.mod(10000000000)).mod(bodyPartCounts[uint8(BodyCategory.HAIR)])),
				uint8((randomNumber.mod(10000000000)).mod(bodyPartCounts[uint8(BodyCategory.HEAD)])),
				uint8((randomNumber.mod(10000000000)).mod(bodyPartCounts[uint8(BodyCategory.MOUTH)])),
				uint8((randomNumber.mod(10000000000)).mod(bodyPartCounts[uint8(BodyCategory.OUTFIT)])),
				uint8((randomNumber.mod(10000000000)).mod(bodyPartCounts[uint8(BodyCategory.SOUL)]))
			);
	}

	function _beforeTokenTransfer(
		address from,
		address to,
		uint256 tokenId
	) internal override whenNotPaused {
		require(false, "Temporarily disabled");
		ERC721Upgradeable._beforeTokenTransfer(from, to, tokenId);
	}

	function tokenURI(uint256 _tokenId) public view override returns (string memory) {
		require(_exists(_tokenId), "Artist doesn't exist");
		return string(abi.encodePacked(_baseURI(), _tokenId));
	}

	function _baseURI() internal view override returns (string memory) {
		return baseURI;
	}

	function addBodyPart(
		uint16 id,
		string calldata name,
		uint16 rarity,
		BodyCategory category
	) external onlyRole(DESIGNER_ROLE) {
		require(rarity > 0 && rarity <= 5, "Rarity out of range");
		BodyPart memory bodyPart = BodyPart(id, name, rarity, category);
		bodyParts[id] = bodyPart;
		bodyPartCounts[uint8(category)] += 1;
		emit BodyPartAdded(bodyPart);
	}

	function getBodyPart(uint16 id) external view returns (BodyPart memory) {
		return bodyParts[id];
	}

	function addToWhitelist(address[] memory addresses) external onlyRole(BACKEND_ROLE) {
		for (uint256 i = 0; i < addresses.length; ++i) {
			whitelist[addresses[i]] = true;
		}
	}

	function removeFromWhitelist(address[] memory addresses) external onlyRole(BACKEND_ROLE) {
		for (uint256 i = 0; i < addresses.length; ++i) {
			whitelist[addresses[i]] = false;
		}
	}

	function changeBaseURI(string memory _newBaseURI) external onlyRole(DEFAULT_ADMIN_ROLE) returns (bool) {
		baseURI = _newBaseURI;
		return true;
	}

	function setStableMintCost(uint256 value) external onlyRole(DEFAULT_ADMIN_ROLE) {
		mintStableCost = value;
		emit PriceChanged(value);
	}

	function changeTreasuryWallet(address _newAddress) external onlyRole(DEFAULT_ADMIN_ROLE) returns (bool) {
		treasuryWallet = _newAddress;
		return true;
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

	function supportsInterface(bytes4 interfaceId)
		public
		view
		override(ERC721Upgradeable, AccessControlUpgradeable)
		returns (bool)
	{
		return super.supportsInterface(interfaceId);
	}
}
