-- Training → Modules: per-user quiz results.
--
-- Each Training Module (lesson) ends with a short multiple-choice quiz. The
-- quiz questions/answers themselves are static/curated (lib/training-lesson-
-- quizzes.ts), not stored in the database — this table only records how a
-- given user scored so the Training Modules page can show a grade per module.
-- lesson_id is a free-text key matching Lesson.id (not a foreign key, since
-- lessons aren't database rows), mirroring training_lesson_progress.
--
-- One row per (user, lesson): `score`/`total` capture the most recent attempt,
-- `best_score` the highest score across all attempts, and `attempts` counts
-- how many times the quiz was taken.

CREATE TABLE IF NOT EXISTS training_lesson_quiz_results (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id     TEXT NOT NULL,
  score         INTEGER NOT NULL,
  total         INTEGER NOT NULL,
  best_score    INTEGER NOT NULL,
  attempts      INTEGER NOT NULL DEFAULT 1,
  completed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_training_lesson_quiz_results_user
  ON training_lesson_quiz_results(user_id);
