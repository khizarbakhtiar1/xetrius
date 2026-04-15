// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/QuestEngine.sol";

/// @notice Add quests 6, 7, 8 to the deployed QuestEngine.
/// Usage: forge script script/AddNewQuests.s.sol --rpc-url wirefluid --private-key $PRIVATE_KEY --broadcast
contract AddNewQuests is Script {
    function run() external {
        uint256 ownerKey = vm.envUint("PRIVATE_KEY");
        address engineAddr = vm.envAddress("QUEST_ENGINE_ADDRESS");

        QuestEngine engine = QuestEngine(engineAddr);

        vm.startBroadcast(ownerKey);

        // Quest 6: Predict Match Winner — 35 points, requires proof
        engine.addQuest(6, 35, true);

        // Quest 7: Watch Party Check-in — 20 points, requires proof
        engine.addQuest(7, 20, true);

        // Quest 8: Superfan — 50 points, requires proof
        engine.addQuest(8, 50, true);

        vm.stopBroadcast();

        console.log("Added quests 6, 7, 8 to QuestEngine at", engineAddr);
    }
}
