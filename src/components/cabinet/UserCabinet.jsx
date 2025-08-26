import HistoryStep from "@/components/history/HistoryStep";

export default function UserCabinet({ sessionId, onSelectGeneration, onBack }) {
  return (
    <HistoryStep 
      sessionId={sessionId} 
      onSelectGeneration={onSelectGeneration}
      onBack={onBack}
    />
  );
}