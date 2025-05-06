// computeStats.js - Utility to compute answer stats for a question in a tournament
// Returns { stats: number[], totalAnswers: number }
function computeAnswerStats(tState, questionUid) {
    if (!tState || !tState.questions) return { stats: [], totalAnswers: 0 };
    const question = (tState.questions || []).find(q => q.uid === questionUid);
    if (!question || !Array.isArray(question.reponses)) return { stats: [], totalAnswers: 0 };
    const answerCounts = new Array(question.reponses.length).fill(0);
    let total = 0;
    for (const jId in tState.answers) {
        const ans = tState.answers[jId][questionUid];
        if (!ans) continue;
        if (Array.isArray(ans.answerIdx)) {
            ans.answerIdx.forEach(idx => {
                if (typeof idx === 'number' && answerCounts[idx] !== undefined) {
                    answerCounts[idx]++;
                }
            });
            total++;
        } else if (typeof ans.answerIdx === 'number' && answerCounts[ans.answerIdx] !== undefined) {
            answerCounts[ans.answerIdx]++;
            total++;
        }
    }
    const stats = answerCounts.map(count => total > 0 ? Math.round((count / total) * 100) : 0);
    return { stats, totalAnswers: total };
}

module.exports = { computeAnswerStats };