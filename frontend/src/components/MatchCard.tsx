import { MatchOddsEVItem } from "@/types";
import MatchRow from "./MatchRow";

interface MatchCardProps {
  match: MatchOddsEVItem;
}

export default function MatchCard({ match }: MatchCardProps) {
  return <MatchRow match={match} />;
}
