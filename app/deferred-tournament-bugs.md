Bugs in deferred mode :
1. When starting, the username is changed by backend immediately to probably guest-userId
2. The array correctAnswers is empty (probably due to DB update)
3. If we refresh the page during the deferred session instead of seeing the session, we get stuck on a loading lobby component
4. Leaderboard not properly updated (getting score 0)