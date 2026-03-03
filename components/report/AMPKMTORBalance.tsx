interface AMPKMTORBalanceProps {
  data: {
    score: number;
    interpretation: string;
    dominant_pathway: string;
    key_indicators: string[];
    optimization_notes: string;
  };
}

export default function AMPKMTORBalance({ data }: AMPKMTORBalanceProps) {
  const score = Math.min(100, Math.max(0, data.score));
  const isBalanced = score >= 40 && score <= 60;
  const isAMPKDominant = score < 40;

  const getColor = () => {
    if (isBalanced) return "text-green-600";
    if (score < 20 || score > 80) return "text-red-600";
    return "text-yellow-600";
  };

  const getBarColor = () => {
    if (isBalanced) return "bg-green-500";
    if (score < 20 || score > 80) return "bg-red-500";
    return "bg-yellow-500";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
        <span>AMPK (Catabólico)</span>
        <span>mTOR (Anabólico)</span>
      </div>

      {/* Balance bar */}
      <div className="relative h-4 bg-muted rounded-full overflow-hidden">
        {/* Optimal zone indicator */}
        <div
          className="absolute top-0 bottom-0 bg-green-100 dark:bg-green-950/30"
          style={{ left: "40%", width: "20%" }}
        />
        <div
          className={`absolute top-0 bottom-0 w-1 rounded-full ${getBarColor()}`}
          style={{ left: `${score}%`, transform: "translateX(-50%)" }}
        />
        {/* Center optimal marker */}
        <div className="absolute top-0 bottom-0 w-px bg-green-400/50" style={{ left: "50%" }} />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>0</span>
        <span className="text-green-600 font-medium">Zona óptima (40–60)</span>
        <span>100</span>
      </div>

      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
        <div className="text-center">
          <p className={`text-2xl font-bold ${getColor()}`}>{score}</p>
          <p className="text-xs text-muted-foreground">Puntuación</p>
        </div>
        <div className="flex-1">
          <p className={`font-medium text-sm ${getColor()}`}>{data.dominant_pathway}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{data.interpretation}</p>
        </div>
      </div>

      {data.key_indicators.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Indicadores clave:</p>
          <ul className="space-y-1">
            {data.key_indicators.map((indicator, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                {indicator}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.optimization_notes && (
        <p className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3">
          {data.optimization_notes}
        </p>
      )}
    </div>
  );
}
