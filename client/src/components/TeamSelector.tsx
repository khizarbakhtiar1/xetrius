"use client";

import Image from "next/image";
import { TEAMS } from "@/lib/teams";
import type { Team } from "@/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface TeamSelectorProps {
  selected: number | null;
  onSelect: (teamId: number) => void;
  disabled?: boolean;
}

export function TeamSelector({ selected, onSelect, disabled }: TeamSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {TEAMS.map((team, i) => (
        <TeamCard
          key={team.id}
          team={team}
          isSelected={selected === team.id}
          onSelect={() => onSelect(team.id)}
          disabled={disabled}
          index={i}
        />
      ))}
    </div>
  );
}

function TeamCard({
  team,
  isSelected,
  onSelect,
  disabled,
  index,
}: {
  team: Team;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  index: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "relative flex flex-col items-center gap-3 p-5 rounded-xl border transition-all cursor-pointer",
        "bg-gradient-to-b",
        isSelected
          ? "border-white/30 ring-1 ring-white/20"
          : "border-white/5 hover:border-white/15",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      style={{
        background: `linear-gradient(to bottom, ${team.primaryColor}12, ${team.primaryColor}06)`,
      }}
    >
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center"
        >
          <Check className="w-3 h-3 text-black" />
        </motion.div>
      )}

      <div
        className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: team.primaryColor + "15" }}
      >
        <Image src={team.logo} alt={team.name} width={48} height={48} className="object-contain" />
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold">{team.name}</p>
      </div>
    </motion.button>
  );
}
