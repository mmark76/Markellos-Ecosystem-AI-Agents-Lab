import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from features.workflow import WorkflowError, WorkflowService


class DepartmentWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.service = WorkflowService(Path(self.temp.name) / "data" / "campus.sqlite3")
        self.service.initialize()
        self.defaults = {"Trainer": "original trainer", "Student": "original student"}

    def tearDown(self):
        self.temp.cleanup()

    def completed_training(self):
        session = self.service.create_training({"Trainer": "trainer:1", "Student": "student:1"}, "Teach claim checking.")
        self.service.append_training_message(session, "Trainer", "Lesson and exercise", "trainer:1")
        self.service.append_training_message(session, "Student", "My answer", "student:1")
        self.service.finish_training(session, "completed")
        return session

    def test_training_record_is_ordered_and_immutable_after_completion(self):
        session = self.completed_training()
        record = self.service.training(session)
        self.assertEqual([entry["role"] for entry in record["chat_log"]], ["User", "Trainer", "Student"])
        self.assertEqual(record["architecture_version"], "four-department-v1")
        with self.assertRaises(WorkflowError):
            self.service.append_training_message(session, "Trainer", "late edit", "trainer:1")

    def test_scorecard_and_approval_gated_prompt_revision_are_separate(self):
        session = self.completed_training()
        scorecard = self.service.create_scorecard(session, "evaluator:1")
        self.service.complete_scorecard(scorecard, json.dumps({"metrics": {"Faithfulness": {"score": 91, "explanation": "Matches the task."}}, "failures": ["None"], "evidence": ["Student addressed the exercise."]}))
        result = self.service.scorecard(scorecard)
        self.assertEqual(result["scorecard"]["metrics"]["Faithfulness"]["score"], 91)
        self.assertEqual(result["scorecard"]["metrics"]["Faithfulness"]["kind"], "model_judgment")
        proposal = self.service.create_proposal(scorecard, "improver:1", json.dumps({"analysis": "Ask for evidence.", "proposed_prompts": {"Trainer": "revised trainer", "Student": "revised student"}}), self.defaults)
        with self.assertRaises(WorkflowError):
            self.service.apply(proposal)
        self.service.approve(proposal)
        applied = self.service.apply(proposal)
        self.assertEqual(applied["status"], "applied")
        self.assertEqual(self.service.current_prompts(self.defaults)["Trainer"], "revised trainer")
        revision = next(row for row in self.service.revisions() if row["role"] == "Trainer")
        self.assertEqual(self.service.rollback("Trainer", revision["id"])["active_revision_id"], revision["id"])

    def test_failed_optimization_is_persisted_and_can_be_retried(self):
        session = self.completed_training()
        scorecard = self.service.create_scorecard(session, "evaluator:1")
        self.service.complete_scorecard(scorecard, "not json")
        first = self.service.create_optimization_attempt(scorecard, "improver:1", self.defaults)
        with self.assertRaises(WorkflowError):
            self.service.create_optimization_attempt(scorecard, "improver:1", self.defaults)
        self.service.fail_optimization(first, "local improver unavailable")
        self.assertEqual(self.service.proposal(first)["status"], "failed")
        retry = self.service.create_optimization_attempt(scorecard, "improver:1", self.defaults, retry_of=first)
        self.assertEqual(self.service.proposal(retry)["retry_of"], first)
