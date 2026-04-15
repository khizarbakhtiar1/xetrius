// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/QuestEngine.sol";

/// @title UpdateQuestProofs
/// @notice Updates all quests to require backend proof verification.
///         Run this once after deploying to enforce server-side verification for every quest.
/// @dev Usage: forge script script/UpdateQuests.s.sol --rpc-url $RPC_URL --broadcast
contract UpdateQuestProofs is Script {
    function run() external {
        uint256 ownerKey = vm.envUint("PRIVATE_KEY");
        address engineAddr = vm.envAddress("QUEST_ENGINE_ADDRESS");

        QuestEngine engine = QuestEngine(engineAddr);

        vm.startBroadcast(ownerKey);

        // Quest 1: Team Pass — verify user holds a pass (was: no proof)
        engine.updateQuest(1, 10, true, true);

        // Quest 2: Toss Predict — already requires proof, no-op for safety
        engine.updateQuest(2, 25, true, true);

        // Quest 3: Match Check-in — verify time window (was: no proof on-chain)
        engine.updateQuest(3, 15, true, true);

        // Quest 4: Fan Vote — verify user voted in poll (was: no proof)
        engine.updateQuest(4, 15, true, true);

        // Quest 5: Referral — verify referralCount > 0 on-chain (was: no proof)
        engine.updateQuest(5, 30, true, true);

        vm.stopBroadcast();

        console.log("All quests updated to requiresProof: true");
    }
}
