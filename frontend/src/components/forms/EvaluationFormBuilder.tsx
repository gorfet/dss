import { useState } from 'react';

interface QuestionDraft {
  id: string;
  prompt: string;
  type: 'likert' | 'multiple_choice' | 'short_text' | 'long_text';
  required: boolean;
}

interface EvaluationFormBuilderProps {
  evaluatorGroupLabel: string;
  onSave: (questions: QuestionDraft[]) => void;
}

export const EvaluationFormBuilder = ({ evaluatorGroupLabel, onSave }: EvaluationFormBuilderProps) => {
  const [questions, setQuestions] = useState<QuestionDraft[]>([
    {
      id: 'q-1',
      prompt: 'Demonstrates subject mastery in the classroom.',
      type: 'likert',
      required: true,
    },
  ]);

  const updateQuestion = (id: string, patch: Partial<QuestionDraft>) => {
    setQuestions((prev) => prev.map((question) => (question.id === id ? { ...question, ...patch } : question)));
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: `q-${prev.length + 1}`,
        prompt: 'New question',
        type: 'short_text',
        required: false,
      },
    ]);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">Form Builder</p>
          <h2 className="text-xl font-semibold text-slate-900">{evaluatorGroupLabel} Form</h2>
        </div>
        <button
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
          type="button"
          onClick={addQuestion}
        >
          Add Question
        </button>
      </header>

      <div className="mt-6 space-y-4">
        {questions.map((question, index) => (
          <div key={question.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-700">Question {index + 1}</p>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <input
                  type="checkbox"
                  checked={question.required}
                  onChange={(event) => updateQuestion(question.id, { required: event.target.checked })}
                />
                Required
              </label>
            </div>
            <input
              className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={question.prompt}
              onChange={(event) => updateQuestion(question.id, { prompt: event.target.value })}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {['likert', 'multiple_choice', 'short_text', 'long_text'].map((type) => (
                <button
                  key={type}
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    question.type === type
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                  type="button"
                  onClick={() => updateQuestion(question.id, { type: type as QuestionDraft['type'] })}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          type="button"
          onClick={() => onSave(questions)}
        >
          Save Form
        </button>
      </div>
    </section>
  );
};
