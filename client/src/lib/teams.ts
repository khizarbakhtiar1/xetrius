import type { Team } from "@/types";

export const TEAMS: Team[] = [
  { id: 0, name: "Islamabad United", shortName: "ISU", logo: "/islamabad-united-logo.png", primaryColor: "#e4002b", secondaryColor: "#ff2d55" },
  { id: 1, name: "Lahore Qalandars", shortName: "LQ", logo: "/lahore-qalandars-logo.png", primaryColor: "#2ecc40", secondaryColor: "#4ade80" },
  { id: 2, name: "Karachi Kings", shortName: "KK", logo: "/karachi-kings-logo.png", primaryColor: "#0074d9", secondaryColor: "#38bdf8" },
  { id: 3, name: "Peshawar Zalmi", shortName: "PZ", logo: "/peshawar-zalmi-logo.png", primaryColor: "#ffdc00", secondaryColor: "#fbbf24" },
  { id: 4, name: "Quetta Gladiators", shortName: "QG", logo: "/quetta-gladiators-logo.png", primaryColor: "#b10dc9", secondaryColor: "#c084fc" },
  { id: 5, name: "Multan Sultans", shortName: "MS", logo: "/multan-sultans-logo.png", primaryColor: "#00b4d8", secondaryColor: "#22d3ee" },
  { id: 6, name: "Rawalpindi Pindiz", shortName: "RPZ", logo: "/Pindiz-Logo.png", primaryColor: "#ff6b35", secondaryColor: "#fb923c" },
  { id: 7, name: "Hyderabad Kingsmen", shortName: "HK", logo: "/Hyderabad_Kingsmen_logo.svg.png", primaryColor: "#06d6a0", secondaryColor: "#34d399" },
];

export function getTeamById(id: number): Team | undefined {
  return TEAMS.find((t) => t.id === id);
}

export function getTeamGradient(team: Team): string {
  return `from-[${team.primaryColor}20] to-[${team.primaryColor}08]`;
}
