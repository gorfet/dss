import type { Request, Response } from 'express';
import { Router } from 'express';
import { authorizeRole } from '../middleware/authorizeRole';
import { aggregateEvaluationScores } from '../services/evaluationScoring';
import type { EvaluationAggregateInput } from '../types';

const router = Router();

router.post('/evaluation-periods', authorizeRole(['admin']), async (request: Request, response: Response) => {
  const payload = request.body;
  return response.status(201).json({ message: 'Evaluation period created.', payload });
});

router.post('/forms', authorizeRole(['admin']), async (request: Request, response: Response) => {
  const payload = request.body;
  return response.status(201).json({ message: 'Evaluation form saved.', payload });
});

router.post('/assignments', authorizeRole(['admin', 'department_head']), async (request: Request, response: Response) => {
  const payload = request.body;
  return response.status(201).json({ message: 'Assignments generated.', payload });
});

router.post('/submissions/:id/submit', authorizeRole(['student', 'faculty', 'peer', 'department_head', 'alumni']), async (
  request: Request,
  response: Response,
) => {
  return response.status(200).json({ message: 'Submission received and locked.' });
});

router.post('/analytics/aggregate', authorizeRole(['admin', 'department_head']), async (request: Request, response: Response) => {
  const input = request.body as EvaluationAggregateInput;
  const aggregate = aggregateEvaluationScores(input);
  return response.status(200).json({ message: 'Aggregate computed.', data: aggregate });
});

router.get('/analytics/faculty/:id', authorizeRole(['admin', 'department_head', 'faculty']), async (
  request: Request,
  response: Response,
) => {
  return response.status(200).json({ message: 'Faculty analytics ready.', facultyId: request.params.id });
});

export default router;
