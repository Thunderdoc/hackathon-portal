# 🚀 HACKATHON EVENT DAY GUIDE

## 1. System Startup
*   **Start the Server**: Double-click `start_hackathon.bat` in the main folder.
*   **Verify**: Open `http://localhost:5001/admin` and login.
*   **Database**: Your database is safe in `database.sqlite`. Backups are created automatically on each start in `server/backups/`.

## 2. Important URLs
| Portal | URL | Description |
| :--- | :--- | :--- |
| **Landing Page** | `http://localhost:5001/` | Registration & Main Hub |
| **Admin** | `http://localhost:5001/admin` | `user: admin`, `pass: admin123` |
| **Judge** | `http://localhost:5001/judge/login` | For evaluators to score teams |
| **Team Login** | `http://localhost:5001/team/login` | For participants |

## 3. Admin Command Center
The **Admin Dashboard** is your mission control.
*   **LIVE TERMINAL**: Monitor `System Logs` here. **All** critical events (Messages, Distress Signals, Submissions, Flagging) appear here. If you miss a notification, check the logs!
*   **BROADCAST**: Type a message and hit "SEND ALERT". This scolls on **all** Team Dashboards instantly.
*   **ADD JUDGE**: Create credentials for judges. If it fails, check the error message (likely username taken).
*   **LOCKDOWN**: Use the "Global Controls" -> "Lockdown" button to **freeze** the event. No teams can submit code after this.
*   **RELEASE RESULTS**: Once judging is done, toggle "RESULTS: HIDDEN" to "RELEASED". Teams will see their scores and confetti!

## 4. Troubleshooting
*   **"I can't see the team message!"** -> Look at the **System Logs** panel (bottom right). It captures everything.
*   **"Judge can't login!"** -> Verify you typed the username exactly right (case-sensitive) when creating them.
*   **"Dashboard isn't loading!"** -> Refresh. The system is now robust enough to load even if one API call fails.
*   **"Timer isn't syncing!"** -> Start the timer from the Admin Dashboard config panel.

## 5. Judge Workflow
1.  **Login** with credentials provided by you.
2.  **View Teams**: Click "Evaluate" on a team.
3.  **Score**: Rate 1-10 on Innovation, Tech, Design, Pitch.
4.  **Feedback**: REQUIRED. Write helpful feedback.
5.  **Submit**: Stores score and updates the live leaderboard.
6.  **Powers**: 
    *   **Flag**: Mark a team for review (Cheating/Issues).
    *   **Golden Buzzer**: Nominate a team for "Crowd Favorite" or special mention.

## 6. Closing the Event
1.  Click **LOCKDOWN** to stop all activity.
2.  Check **Leaderboard** for top scorers.
3.  Click **Export Data** (if needed) or "Download CSV" from Logs to save a record of the event.
4.  Click **Release Results** to announce winners to all dashboards.

**Good Luck! 🚀**
