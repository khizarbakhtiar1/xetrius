// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/// @title TeamPass
/// @notice Soulbound ERC-721 representing a fan's PSL franchise allegiance.
/// @dev One NFT per wallet. On-chain metadata. Team change with 90-day cooldown.
contract TeamPass is ERC721, ERC721Enumerable, Ownable, Pausable {
    using Strings for uint256;
    using Strings for uint8;

    uint256 private _nextTokenId;

    uint8 public constant NUM_TEAMS = 8;
    uint256 public constant TEAM_CHANGE_COOLDOWN = 90 days;

    /// @dev Token-level data.
    mapping(uint256 => uint8) public tokenTeam;
    mapping(uint256 => uint256) public tokenMintTime;
    mapping(uint256 => uint256) public lastTeamChange;

    /// @dev Address → tokenId lookup (0 means no pass).
    mapping(address => uint256) public passOf;

    /// @dev Per-team fan counts.
    mapping(uint8 => uint256) public teamFanCount;

    /// @dev Referral tracking.
    mapping(address => uint256) public referralCount;

    // ── Events ──────────────────────────────────────────────────────────

    event TeamPassMinted(address indexed owner, uint256 tokenId, uint8 teamId);
    event TeamChanged(address indexed owner, uint256 tokenId, uint8 oldTeamId, uint8 newTeamId);

    // ── Errors ──────────────────────────────────────────────────────────

    error AlreadyHasPass();
    error InvalidTeam();
    error NoPass();
    error NotReady();
    error CannotReferSelf();
    error ReferrerHasNoPass();
    error Soulbound();

    // ── Constructor ─────────────────────────────────────────────────────

    constructor() ERC721("Xetrius Team Pass", "XPASS") Ownable(msg.sender) {
        _nextTokenId = 1;
    }

    // ── Minting ─────────────────────────────────────────────────────────

    /// @notice Mint a free Team Pass for a PSL franchise.
    /// @param teamId The franchise id (0-7).
    /// @param referrer Address of the referring fan, or address(0) for none.
    function mint(uint8 teamId, address referrer) external whenNotPaused {
        if (passOf[msg.sender] != 0) revert AlreadyHasPass();
        if (teamId >= NUM_TEAMS) revert InvalidTeam();
        if (referrer == msg.sender) revert CannotReferSelf();
        if (referrer != address(0) && passOf[referrer] == 0) revert ReferrerHasNoPass();

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);

        tokenTeam[tokenId] = teamId;
        tokenMintTime[tokenId] = block.timestamp;
        passOf[msg.sender] = tokenId;
        teamFanCount[teamId]++;

        if (referrer != address(0)) {
            referralCount[referrer]++;
        }

        emit TeamPassMinted(msg.sender, tokenId, teamId);
    }

    // ── Team Change ─────────────────────────────────────────────────────

    /// @notice Switch your franchise allegiance. Enforces a 90-day cooldown.
    /// @param newTeamId The new franchise id (0-7).
    function changeTeam(uint8 newTeamId) external {
        uint256 tokenId = passOf[msg.sender];
        if (tokenId == 0) revert NoPass();
        if (newTeamId >= NUM_TEAMS) revert InvalidTeam();

        uint256 lastChange = lastTeamChange[tokenId];
        uint256 earliest = lastChange == 0 ? tokenMintTime[tokenId] : lastChange;
        if (block.timestamp < earliest + TEAM_CHANGE_COOLDOWN) revert NotReady();

        uint8 oldTeamId = tokenTeam[tokenId];
        teamFanCount[oldTeamId]--;
        teamFanCount[newTeamId]++;
        tokenTeam[tokenId] = newTeamId;
        lastTeamChange[tokenId] = block.timestamp;

        emit TeamChanged(msg.sender, tokenId, oldTeamId, newTeamId);
    }

    // ── View Functions ──────────────────────────────────────────────────

    /// @notice Check if an address owns a Team Pass.
    /// @param user The address to check.
    /// @return True if the user has a pass.
    function hasPass(address user) external view returns (bool) {
        return passOf[user] != 0;
    }

    /// @notice Get the team id for a given user.
    /// @param user The address to look up.
    /// @return The team id (0-7).
    function getTeam(address user) external view returns (uint8) {
        uint256 tokenId = passOf[user];
        if (tokenId == 0) revert NoPass();
        return tokenTeam[tokenId];
    }

    /// @notice Total passes minted.
    /// @return The count.
    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    // ── On-chain Metadata ───────────────────────────────────────────────

    /// @notice Returns a fully on-chain base64-encoded JSON metadata blob.
    /// @param tokenId The token to query.
    /// @return A data URI with JSON metadata.
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);

        string memory json = string.concat(
            '{"name":"Xetrius Team Pass #',
            tokenId.toString(),
            '","description":"PSL Fan Quest Platform - Soulbound Team Pass","attributes":[{"trait_type":"teamId","value":',
            uint256(tokenTeam[tokenId]).toString(),
            '},{"trait_type":"mintTime","value":',
            tokenMintTime[tokenId].toString(),
            "}]}"
        );

        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    // ── Pause Controls ──────────────────────────────────────────────────

    /// @notice Pause minting.
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause minting.
    function unpause() external onlyOwner {
        _unpause();
    }

    // ── Soulbound Enforcement ───────────────────────────────────────────

    /// @dev Block all transfers except minting and burning.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert Soulbound();
        }
        return super._update(to, tokenId, auth);
    }

    /// @dev Required override for ERC721Enumerable.
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    /// @dev Required override for ERC721 + ERC721Enumerable.
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
