## Attempt 2: Pause Timer with `notificationCompletionPending`

- **Strategy:** Introduced a `notificationCompletionPending` flag in `useTimer.ts`.
  - When a main session block completed naturally, `checkTimeAndTriggerCompletion` would set this flag to `true` instead of immediately resetting the timer for the next block.
  - The `AppState` listener in `useTimer.ts` (when the app becomes active) would avoid calling `resetTimerToNextInterval` if this flag was `true`.
  - In `app/(tabs)/index.tsx`, `handleNotificationInteraction` was updated to:
    - Set `notificationCompletionPending(true)`.
    - Navigate with `action: 'showCompletionModal'`.
    - Set `timerStatus('completed')`.
    - For test mode, it also called `setIsRunning(false)`.
  - A new function `continueToNextBlock` was added to `useTimer.ts` (and called from `handleCompletionSubmit` and the modal's `onClose` in `index.tsx`) to clear the `notificationCompletionPending` flag, reset the timer for the next interval, and set `timerStatus('running')`.
- **Linter Fix:** Ensured `setIsRunning` was exported from `useTimer` and destructured in `index.tsx`.
- **Result:** Still failed for main session notifications. Clicking the notification opened the app, the timer started running for the next block, but the modal did not appear. Test mode notifications continued to work correctly.
- **Reasoning for Failure (Hypothesis):** Despite attempts to pause the timer logic, the sequence of state updates across `useTimer` (especially `AppState` changes, `checkTimeAndTriggerCompletion`) and `index.tsx` (navigation, `useEffect` hooks reacting to `route.params` and `timerStatus`) likely still allowed the main session's state to advance (timer appearing to run for the _next_ block) too quickly. The core difference that `testModeCompleteOSTrigger` in `handleNotificationInteraction` directly called `setIsRunning(false)` while the main session path did not, seemed significant. The modal might have been technically set to visible but was immediately superseded or dismissed by the rapid state changes reflecting a new, running session block.

---

## Attempt 3: Fix Test Mode Notification Trigger Signature

- **Strategy:** Correct the trigger configuration for scheduling test mode notifications to use the proper `timeInterval` trigger type with `seconds`, `repeats`, and `channelId`.
- **Changes:**
  - In `app/(tabs)/index.tsx`, updated `scheduleDelayedNotificationForTestMode`:
    - Removed `channelId` from `content`.
    - Changed `trigger` to:
      ```ts
      trigger: {
        type: 'timeInterval',      // Time interval trigger
        seconds: seconds,          // Delay in seconds
        repeats: false,            // Single notification
        channelId: CRITICAL_CHANNEL_ID, // Android channel
      }
      ```
- **Result:** Notification should now respect the specified 5-second delay without firing immediately at startup.
- **Next Steps:**
  1. Test on both iOS and Android to confirm delayed notification.
  2. If immediate notification still occurs, investigate whether `cancelAllScheduledNotificationsAsync` is triggering queued OS alerts.

---
