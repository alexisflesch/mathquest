🎯 Goal

Select N random questions for a given discipline, gradeLevel, and theme,
balancing as evenly as possible across tags,
while ensuring no duplicates and minimal server load.

FUNCTION selectRandomQuestions(discipline, gradeLevel, theme, N):

    # 1. Define or fetch available tags for the selected theme
    tags = getTagsForTheme(discipline, theme)

    # 2. Compute how many questions per tag to request
    perTag = CEIL(N / LENGTH(tags))

    # 3. Prepare an empty result set
    selectedQuestions = EMPTY_LIST()

    # 4. For each tag, query a few random questions
    FOR EACH tag IN tags:
        questions = QUERY_DATABASE(
            """
            SELECT * FROM questions
            WHERE discipline = $1
              AND $2 = ANY(themes)
              AND $3 = ANY(tags)
              AND (grade_level IS NULL OR grade_level = $4)
              AND is_hidden = false
            ORDER BY RANDOM()
            LIMIT $5
            """,
            [discipline, theme, tag, gradeLevel, perTag]
        )
        ADD_UNIQUE(selectedQuestions, questions)

        IF LENGTH(selectedQuestions) >= N:
            BREAK

    # 5. If not enough questions found (some tags are rare)
    IF LENGTH(selectedQuestions) < N:
        remaining = QUERY_DATABASE(
            """
            SELECT * FROM questions
            WHERE discipline = $1
              AND $2 = ANY(themes)
              AND (grade_level IS NULL OR grade_level = $3)
              AND is_hidden = false
              AND uid NOT IN ($4)
            ORDER BY RANDOM()
            LIMIT $5
            """,
            [discipline, theme, gradeLevel, selectedQuestions.uids, N - LENGTH(selectedQuestions)]
        )
        ADD_UNIQUE(selectedQuestions, remaining)

    # 6. Shuffle the final set once more for fairness
    SHUFFLE(selectedQuestions)

    # 7. Return the first N elements
    RETURN FIRST_N(selectedQuestions, N)


🧩 Notes

getTagsForTheme() can be:

read from a YAML/JSON definition, or

derived dynamically by querying all tags in the theme.

ADD_UNIQUE() ensures no duplicate uid values.

ORDER BY RANDOM() is fine for small batches — it only runs on small filtered subsets.

This algorithm avoids loading the full dataset into memory.

Works even if some tags have only one question.