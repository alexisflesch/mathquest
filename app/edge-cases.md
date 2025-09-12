# Edge Cases and Potential Issues

This file documents edge cases that may cause bugs, along with test scenarios.

## Edge Cases

### 1. User Authentication Edge Cases

#### Guest User Upgrade Scenarios
- **Scenario**: Guest user tries to upgrade to student but email already exists
- **Expected**: Clear error message, suggest login instead
- **Test**: Mock existing email, attempt upgrade

#### Teacher Registration Without Admin Password
- **Scenario**: User tries to register as teacher without valid admin password
- **Expected**: Registration fails with appropriate error
- **Test**: Invalid admin password, verify rejection

#### Concurrent Login Attempts
- **Scenario**: Multiple login attempts with same credentials simultaneously
- **Expected**: Only one successful login, others fail gracefully
- **Test**: Simulate concurrent requests

### 2. Game Session Edge Cases

#### Player Joins After Game Started
- **Scenario**: Student joins quiz after first question has started
- **Expected**: Player can join but misses first question
- **Test**: Start quiz, then join new player

#### Game End with No Participants
- **Scenario**: All players disconnect before game ends
- **Expected**: Game should still end gracefully
- **Test**: Disconnect all players mid-game

#### Tournament with Single Participant
- **Scenario**: Only one player in tournament
- **Expected**: Tournament completes, player gets first place
- **Test**: Create tournament with one participant

### 3. Question Management Edge Cases

#### Question with Invalid LaTeX
- **Scenario**: Question contains malformed LaTeX syntax
- **Expected**: Question saves but renders with error indication
- **Test**: Create question with `\[ \invalid \latex \]`

#### Question with Very Long Text
- **Scenario**: Question text exceeds database field limits
- **Expected**: Validation fails with clear error
- **Test**: Attempt to create question with 10,000+ characters

#### Duplicate Question UIDs
- **Scenario**: Two teachers create questions with same UID
- **Expected**: Second creation fails with duplicate error
- **Test**: Create question, then create another with same UID

### 4. Timer and Scoring Edge Cases

#### Timer Expires at Exact Same Time
- **Scenario**: Multiple players submit answers at timer expiry
- **Expected**: All submissions processed correctly
- **Test**: Simulate timer expiry with queued submissions

#### Negative Scores
- **Scenario**: Scoring algorithm produces negative score
- **Expected**: Score clamped to 0 or handled appropriately
- **Test**: Create scenario with very wrong answer

#### Score Update During Leaderboard Display
- **Scenario**: Score updates while leaderboard is being displayed
- **Expected**: Leaderboard shows consistent state
- **Test**: Update scores during leaderboard fetch

### 5. Network and Connection Edge Cases

#### Socket Reconnection During Question
- **Scenario**: Player loses connection mid-question, reconnects
- **Expected**: Player can continue from current state
- **Test**: Disconnect and reconnect socket during active question

#### Slow Network Upload
- **Scenario**: Player submits answer but network is very slow
- **Expected**: Answer accepted if submitted before timer expires
- **Test**: Simulate slow network with delayed submission

#### Browser Tab Refresh
- **Scenario**: Player refreshes browser during game
- **Expected**: Player can rejoin if game still active
- **Test**: Refresh page during active game

### 6. Multi-Device Scenarios

#### Same User on Multiple Devices
- **Scenario**: User logged in on phone and computer simultaneously
- **Expected**: Both sessions work independently
- **Test**: Login on two devices, participate in same game

#### Device Switching Mid-Game
- **Scenario**: Player switches from phone to computer mid-game
- **Expected**: Game state transfers correctly
- **Test**: Start on mobile, continue on desktop

### 7. Data Validation Edge Cases

#### Empty Arrays in Question Creation
- **Scenario**: Question created with empty themes array
- **Expected**: Validation passes or provides default
- **Test**: Create question with `themes: []`

#### Unicode Characters in Usernames
- **Scenario**: Username contains emojis or special unicode
- **Expected**: Handled correctly in database and display
- **Test**: Register user with emoji in username

#### Very Long Usernames
- **Scenario**: Username exceeds field length
- **Expected**: Validation fails
- **Test**: Attempt registration with 100+ character username

### 8. Tournament Mode Specific Edge Cases

#### Deferred Tournament Expiration
- **Scenario**: Player tries to join expired deferred tournament
- **Expected**: Clear error message
- **Test**: Set tournament dates to past, attempt join

#### Tournament with No Questions
- **Scenario**: Tournament created but no questions available
- **Expected**: Tournament fails to start
- **Test**: Create tournament with empty question set

#### Participant Leaves Tournament
- **Scenario**: Player disconnects during tournament
- **Expected**: Tournament continues, player can rejoin if possible
- **Test**: Disconnect participant mid-tournament

### 9. Practice Mode Edge Cases

#### Practice Session Timeout
- **Scenario**: Practice session expires while user is active
- **Expected**: Session extends or user notified
- **Test**: Wait for session timeout

#### Practice with No Questions
- **Scenario**: No questions match practice filters
- **Expected**: Clear message about no available questions
- **Test**: Set filters that match no questions

### 10. Admin and Teacher Edge Cases

#### Teacher Creates Game Without Permission
- **Scenario**: Non-teacher tries to create quiz
- **Expected**: Request rejected
- **Test**: Student attempts to create quiz

#### Bulk Question Import
- **Scenario**: Large YAML file with many questions
- **Expected**: All questions processed or partial failure handled
- **Test**: Import file with 100+ questions

## Test Implementation Notes

For each edge case, create unit/integration tests that:
1. Set up the specific scenario
2. Execute the operation
3. Verify expected behavior
4. Clean up test data

Use mocking for external dependencies (database, Redis, email service) to ensure reliable tests.
