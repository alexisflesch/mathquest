# Intro

Mathquest's scoring system needs to be rewritten. Below are instructions.



# Scaling
Total number of points for a given game should be 1000. Scoring system has to be updated to scale accordingly.

Rem : You can use the questionUids array from the Redis key (e.g., mathquest:game:3189) to get the number of questions for a game.

# Scoring for multiple choice questions

For multiple-choice questions with several correct answers, we use a balanced scoring system to reward precision and discourage guessing.

Let:

B = total number of correct answers
M = total number of incorrect answers
C_B = number of correct answers selected
C_M = number of incorrect answers selected

We compute the raw score as:
raw_score = max(0, (C_B / B) - (C_M / M))

Then scale it to a 0–1000 range:
final_score = 1000 × raw_score


# Time penalty

To encourage quick but thoughtful answers, we apply a soft time-based penalty to each question's score using a logarithmic decay model.

⏱️ Formula
Let:

t = time taken by the user to answer (in seconds)
T = maximum time allowed for the question (in seconds)
α = penalty coefficient (e.g. 0.3 means up to 30% penalty)
base_score = score before time penalty (out of 1000)

We compute the time penalty factor as:
time_penalty_factor = min(1, log(t + 1) / log(T + 1))

Then apply the penalty:
final_score = base_score × (1 − α × time_penalty_factor)

✅ Properties
The penalty increases slowly with time (logarithmic), avoiding harsh drops for minor delays.

A perfect score is still possible if the user answers quickly.

Users who take the full allocated time (t = T) receive the maximum penalty defined by α.

🧮 Example (α = 0.3, T = 60):
Time taken (t)	Penalty factor	Final score (from 1000)
5s	~0.33	901
15s	~0.59	823
30s	~0.79	763
60s	1.0	700

This approach allows to balance speed and accuracy while maintaining a fair and engaging experience.