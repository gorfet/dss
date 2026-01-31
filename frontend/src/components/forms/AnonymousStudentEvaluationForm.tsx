import { useRef } from 'react';

interface LikertQuestion {
  id: string;
  prompt: string;
}

interface AnonymousStudentEvaluationFormProps {
  courseLabel: string;
  questions: LikertQuestion[];
  onSubmit: (responses: Record<string, number>) => void;
}

export const AnonymousStudentEvaluationForm = ({
  courseLabel,
  questions,
  onSubmit,
}: AnonymousStudentEvaluationFormProps) => {
  const responsesRef = useRef<Record<string, number>>({});

  return (
    <form
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(responsesRef.current);
      }}
    >
      <header className="space-y-1">
        <p className="text-sm font-medium text-slate-500">Anonymous Evaluation</p>
        <h2 className="text-xl font-semibold text-slate-900">{courseLabel}</h2>
        <p className="text-sm text-slate-600">
          Your identity is never stored. Responses are submitted with a secure anonymized token.
        </p>
      </header>

      <div className="space-y-4">
        {questions.map((question) => (
          <div key={question.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">{question.prompt}</p>
            <div className="mt-3 flex gap-2">
              {[1, 2, 3, 4, 5].map((score) => (
                <label
                  key={`${question.id}-${score}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-sm font-semibold text-slate-600"
                >
                  <input
                    className="sr-only"
                    name={question.id}
                    type="radio"
                    value={score}
                    onChange={() => {
                      responsesRef.current[question.id] = score;
                    }}
                  />
                  {score}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">
        Submit Evaluation
      </button>
    </form>
  );
};
