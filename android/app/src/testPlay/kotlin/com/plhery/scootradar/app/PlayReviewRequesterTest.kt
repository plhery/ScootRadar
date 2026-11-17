package com.plhery.scootradar.app

import android.app.Activity
import android.os.Looper
import androidx.fragment.app.FragmentActivity
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.google.android.gms.tasks.Task
import com.google.android.gms.tasks.TaskCompletionSource
import com.google.android.gms.tasks.Tasks
import com.google.android.play.core.review.ReviewInfo
import com.google.android.play.core.review.ReviewManager
import com.google.android.play.core.review.testing.FakeReviewManager
import org.junit.Assert.assertEquals
import org.junit.Assert.assertSame
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.Robolectric
import org.robolectric.Shadows.shadowOf

/**
 * Google Play's card to rate the app (X-AD27, LOG-310): the card is asked for with what Play gave as the map began to
 * rest, in the activity that shows the map, and nothing is shown, or told, when Play can't give it, the activity has
 * gone, or something has come over the map or a touch on it by the time Play answers. Play's own FakeReviewManager stands in for Play, as Google's guide has it. The activity is a
 * FragmentActivity, as MainActivity is, whose listeners the Task API ends with it.
 */
@RunWith(AndroidJUnit4::class)
class PlayReviewRequesterTest {
    private val activity = Robolectric.buildActivity(FragmentActivity::class.java).setup()

    /** Play's fake, with what it was asked counted; [answers] in turn, then the fake's. */
    private class CountingReviewManager(vararg answers: Task<ReviewInfo>) : ReviewManager {
        private val fake = FakeReviewManager(ApplicationProvider.getApplicationContext())
        private val answers = ArrayDeque(answers.toList())
        var asked = 0
        val shown = mutableListOf<Pair<Activity, ReviewInfo>>()

        override fun requestReviewFlow(): Task<ReviewInfo> {
            asked += 1
            return answers.removeFirstOrNull() ?: fake.requestReviewFlow()
        }

        override fun launchReviewFlow(activity: Activity, reviewInfo: ReviewInfo): Task<Void> {
            shown += activity to reviewInfo
            return fake.launchReviewFlow(activity, reviewInfo)
        }
    }

    private fun idle() = shadowOf(Looper.getMainLooper()).idle()

    private fun reviewInfo(): ReviewInfo = FakeReviewManager(ApplicationProvider.getApplicationContext()).requestReviewFlow().result

    @Test
    fun whatPlayGaveAsTheMapBeganToRestShowsTheCardWhenTheRestEnds() {
        val manager = CountingReviewManager()
        var made = 0
        val requester = PlayReviewRequester(activity.get()) { manager.also { made += 1 } }
        // Play's manager is made at the first ask, not with the activity.
        assertEquals(0, made)
        requester.prepare()
        idle()
        assertEquals(1, made)
        assertEquals(1, manager.asked)
        assertEquals(0, manager.shown.size)

        requester.request { true }
        idle()
        assertEquals(1, manager.asked)
        assertEquals(1, manager.shown.size)
        assertSame(activity.get(), manager.shown.single().first)

        // The next ask readies its own, with the same manager.
        requester.request { true }
        idle()
        assertEquals(2, manager.asked)
        assertEquals(2, manager.shown.size)
        assertEquals(1, made)
    }

    @Test
    fun withoutPlaysStoreNothingIsShownOrSaid() {
        val gone = Tasks.forException<ReviewInfo>(IllegalStateException("Play Store app is not installed"))
        val manager = CountingReviewManager(gone, gone)
        val requester = PlayReviewRequester(activity.get()) { manager }
        requester.prepare()
        idle()
        // What failed as the rest began is asked for again at its end, and fails again.
        requester.request { true }
        idle()
        assertEquals(2, manager.asked)
        assertEquals(0, manager.shown.size)
    }

    @Test
    fun whatFailedAsTheRestBeganIsAskedAgainAtItsEnd() {
        val manager = CountingReviewManager(Tasks.forException(IllegalStateException("no connection")))
        val requester = PlayReviewRequester(activity.get()) { manager }
        requester.prepare()
        idle()
        requester.request { true }
        idle()
        assertEquals(2, manager.asked)
        assertEquals(1, manager.shown.size)
    }

    /** Gone to the background, as the rider leaves the app, Play's late answer shows no card over another app's. */
    @Test
    fun anActivityStoppedBeforePlayAnsweredShowsNoCard() {
        val answer = TaskCompletionSource<ReviewInfo>()
        val manager = CountingReviewManager(answer.task)
        val requester = PlayReviewRequester(activity.get()) { manager }
        requester.request { true }
        activity.pause().stop()
        answer.setResult(reviewInfo())
        idle()
        assertEquals(0, manager.shown.size)
    }

    /** A scooter tapped, or the search opened, before Play answered: no card over it. */
    @Test
    fun somethingOverTheMapBeforePlayAnsweredShowsNoCard() {
        val answer = TaskCompletionSource<ReviewInfo>()
        val manager = CountingReviewManager(Tasks.forException(IllegalStateException("no connection")), answer.task)
        val requester = PlayReviewRequester(activity.get()) { manager }
        var asking = true
        requester.prepare()
        idle()
        requester.request { asking }
        asking = false
        answer.setResult(reviewInfo())
        idle()
        assertEquals(2, manager.asked)
        assertEquals(0, manager.shown.size)
    }

    /**
     * The rider puts a finger on the map and pans, or presses a key, before Play answered: the map is no longer at
     * rest, and no card comes over it (week review, finding 6.3). The next ask, on a map at rest again, shows its card.
     */
    @Test
    fun aTouchBeforePlayAnsweredShowsNoCard() {
        val answer = TaskCompletionSource<ReviewInfo>()
        val manager = CountingReviewManager(answer.task)
        val requester = PlayReviewRequester(activity.get()) { manager }
        requester.request { true }
        requester.noteInteraction()
        answer.setResult(reviewInfo())
        idle()
        assertEquals(0, manager.shown.size)

        // A touch before an ask takes back none of it.
        requester.noteInteraction()
        requester.request { true }
        idle()
        assertEquals(1, manager.shown.size)
    }

    @Test
    fun anActivityLeftBeforePlayAnsweredShowsNoCard() {
        val answer = TaskCompletionSource<ReviewInfo>()
        val manager = CountingReviewManager(answer.task)
        val requester = PlayReviewRequester(activity.get()) { manager }
        requester.request { true }
        activity.pause().stop().destroy()
        answer.setResult(reviewInfo())
        idle()
        assertEquals(0, manager.shown.size)
    }
}
