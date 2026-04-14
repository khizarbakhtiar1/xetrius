// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/// @title MissionStamps
/// @notice Soulbound ERC-1155 mission stamps for Xetrius quests.
/// @dev Only the QuestEngine can mint. Transfers are blocked via _update override.
contract MissionStamps is ERC1155, Ownable {
    // ── Stamp ID Constants ──────────────────────────────────────────────

    uint256 public constant STAMP_TEAM_PASS = 1;
    uint256 public constant STAMP_TOSS_PREDICT = 2;
    uint256 public constant STAMP_MATCH_CHECKIN = 3;
    uint256 public constant STAMP_FAN_VOTE = 4;
    uint256 public constant STAMP_REFERRAL = 5;

    /// @notice The QuestEngine address that is authorised to mint stamps.
    address public questEngine;

    /// @notice Tracks whether a user has earned a stamp for a specific match.
    /// @dev earned[user][stampId][matchId] => bool
    mapping(address => mapping(uint256 => mapping(uint256 => bool))) public earned;

    /// @notice Number of unique stamp types a user owns.
    mapping(address => uint256) private _stampCount;

    /// @notice Tracks which stamp types a user has ever been minted.
    mapping(address => mapping(uint256 => bool)) private _hasStampType;

    /// @notice Global mint count per stamp type.
    mapping(uint256 => uint256) public totalMinted;

    // ── Events ──────────────────────────────────────────────────────────

    event StampMinted(address indexed to, uint256 stampId, uint256 matchId);
    event QuestEngineSet(address indexed newEngine);

    // ── Errors ──────────────────────────────────────────────────────────

    error OnlyQuestEngine();
    error Soulbound();
    error AlreadyEarned();

    // ── Constructor ─────────────────────────────────────────────────────

    constructor() ERC1155("https://xetrius.io/stamps/") Ownable(msg.sender) {}

    // ── Admin ───────────────────────────────────────────────────────────

    /// @notice Set the QuestEngine address that is allowed to mint stamps.
    /// @param _engine The QuestEngine contract address.
    function setQuestEngine(address _engine) external onlyOwner {
        questEngine = _engine;
        emit QuestEngineSet(_engine);
    }

    // ── Minting ─────────────────────────────────────────────────────────

    /// @notice Mint a soulbound mission stamp. Only callable by QuestEngine.
    /// @param to The recipient address.
    /// @param stampId The stamp type (1-5).
    /// @param matchId The match context (0 for non-match quests).
    function mintStamp(address to, uint256 stampId, uint256 matchId) external {
        if (msg.sender != questEngine) revert OnlyQuestEngine();
        if (earned[to][stampId][matchId]) revert AlreadyEarned();

        earned[to][stampId][matchId] = true;
        totalMinted[stampId]++;

        if (!_hasStampType[to][stampId]) {
            _hasStampType[to][stampId] = true;
            _stampCount[to]++;
        }

        _mint(to, stampId, 1, "");

        emit StampMinted(to, stampId, matchId);
    }

    // ── View Functions ──────────────────────────────────────────────────

    /// @notice Returns the total number of unique stamp types a user owns.
    /// @param user The address to query.
    /// @return The count of unique stamp types.
    function stampCount(address user) external view returns (uint256) {
        return _stampCount[user];
    }

    /// @notice Returns the metadata URI for a given stamp id.
    /// @param tokenId The stamp id.
    /// @return The URI string.
    function uri(uint256 tokenId) public pure override returns (string memory) {
        return string.concat("https://xetrius.io/stamps/", Strings.toString(tokenId));
    }

    // ── Soulbound Enforcement ───────────────────────────────────────────

    /// @dev Block all transfers except mints (from == address(0)) and burns (to == address(0)).
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override
    {
        if (from != address(0) && to != address(0)) {
            revert Soulbound();
        }
        super._update(from, to, ids, values);
    }
}
