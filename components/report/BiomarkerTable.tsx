import { Badge } from "@/components/ui/badge";
import type { BiomarkerExtraction, BiomarkerStatus } from "@/types/database";
import { formatNumber } from "@/lib/utils/format";

interface BiomarkerTableProps {
  biomarkers: BiomarkerExtraction[];
}

const STATUS_LABELS: Record<BiomarkerStatus, string> = {
  optimal: "Óptimo",
  suboptimal: "Subóptimo",
  concerning: "Atención",
  critical: "Crítico",
};

export default function BiomarkerTable({ biomarkers }: BiomarkerTableProps) {
  if (biomarkers.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No se extrajeron biomarcadores de este documento.
      </p>
    );
  }

  const sorted = [...biomarkers].sort((a, b) => {
    const order = { critical: 0, concerning: 1, suboptimal: 2, optimal: 3 };
    return (
      (order[a.status as BiomarkerStatus] ?? 4) -
      (order[b.status as BiomarkerStatus] ?? 4)
    );
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 pr-4 font-medium text-muted-foreground">
              Biomarcador
            </th>
            <th className="text-right py-2 pr-4 font-medium text-muted-foreground">
              Tu valor
            </th>
            <th className="text-right py-2 pr-4 font-medium text-muted-foreground hidden md:table-cell">
              Rango lab
            </th>
            <th className="text-right py-2 pr-4 font-medium text-muted-foreground hidden md:table-cell">
              Rango FIM óptimo
            </th>
            <th className="text-right py-2 font-medium text-muted-foreground">
              Estado FIM
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((b) => (
            <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
              <td className="py-3 pr-4 font-medium">{b.biomarker_name}</td>
              <td className="py-3 pr-4 text-right tabular-nums">
                {b.numeric_value !== null
                  ? `${formatNumber(b.numeric_value)} ${b.unit ?? ""}`
                  : b.raw_value}
              </td>
              <td className="py-3 pr-4 text-right text-muted-foreground hidden md:table-cell">
                {b.reference_range_low !== null &&
                b.reference_range_high !== null
                  ? `${b.reference_range_low} – ${b.reference_range_high}`
                  : "—"}
              </td>
              <td className="py-3 pr-4 text-right text-muted-foreground hidden md:table-cell">
                {b.fim_range_optimal_low !== null &&
                b.fim_range_optimal_high !== null
                  ? `${b.fim_range_optimal_low} – ${b.fim_range_optimal_high}`
                  : "—"}
              </td>
              <td className="py-3 text-right">
                {b.status ? (
                  <Badge
                    variant={b.status as BiomarkerStatus}
                    className="ml-auto"
                  >
                    {STATUS_LABELS[b.status as BiomarkerStatus]}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
