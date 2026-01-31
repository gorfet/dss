import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export interface CompetencyDatum {
  category: string;
  score: number;
}

interface CompetencyRadarProps {
  data: CompetencyDatum[];
}

export const CompetencyRadar = ({ data }: CompetencyRadarProps) => {
  return (
    <div className="h-80 w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Competency Overview</h3>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          Normalized Scores
        </span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="80%">
          <PolarGrid />
          <PolarAngleAxis dataKey="category" tick={{ fill: '#475569', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
          <Radar dataKey="score" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.6} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
