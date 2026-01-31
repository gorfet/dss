import { CompetencyRadar, type CompetencyDatum } from '../charts/CompetencyRadar';

interface FacultyDashboardProps {
  facultyName: string;
  overallScore: number;
  trendLabel: string;
  competencyData: CompetencyDatum[];
}

export const FacultyDashboard = ({
  facultyName,
  overallScore,
  trendLabel,
  competencyData,
}: FacultyDashboardProps) => {
  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Welcome back</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{facultyName}</h1>
            <p className="text-sm text-slate-600">360° Faculty Evaluation Summary</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-500">Overall Score</p>
            <p className="text-3xl font-semibold text-emerald-600">{overallScore.toFixed(1)}%</p>
            <p className="text-xs text-slate-500">{trendLabel}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">Latest Insights</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
              Student engagement improved over last semester.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-amber-500" />
              Classroom management dipped slightly in large lectures.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
              Research impact score remains above department average.
            </li>
          </ul>
        </div>

        <div className="lg:col-span-2">
          <CompetencyRadar data={competencyData} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">Action Plan</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
              <p className="font-medium text-slate-700">Next Steps</p>
              <p className="mt-2">
                Target active learning strategies for sophomore courses and increase feedback
                touchpoints during midterm evaluations.
              </p>
            </div>
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Update Action Plan
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700">Recent Feedback Themes</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Clear expectations', 'Project-based learning', 'Timely feedback', 'Mentorship'].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
