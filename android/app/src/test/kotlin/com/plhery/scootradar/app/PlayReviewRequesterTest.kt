package com.plhery.scootradar.app

import android.app.Activity
import android.os.Looper
import androidx.activity.ComponentActivity
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
 * Google Play's card to rate the app (X-AD27, LOG-310, LOG-408): the card is asked for with what Play gave as the map
 * began to rest, in the activity that shows the map, and nothing is shown, or told, when Play can't give it or the
 * activity has gone. Play's own FakeReviewManager stands in for Play, as Google's guide has it.
 */
@RunWith(AndroidJUnit4::class)
class PlayReviewRequesterTest {
    private val activity = Robolectric.buildActivity(ComponentActivity::class.java).setup()

    /** Play's fake, with what it was asked counted. */
    private class CountingReviewManager(private val answer: () -> Task<ReviewInfo>? = { null }) : ReviewManager {
        private val fake = FakeReviewManager(ApplicationProvider.getApplicationContext())
        var asked = 0
        val shown = mutableListOf<Pair<Activity, ReviewInfo>>()

        override fun requestReviewFlow(): Task<ReviewInfo> {
            asked += 1
            return answer() ?: fake.requestReviewFlow()
        }

        override fun launchReviewFlow(activity: Activity, reviewInfo: ReviewInfo): Task<Void> {
            shown += activity to reviewInfo
            return fake.launchReviewFlow(activity, reviewInfo)
        }
    }

    @Test
    fun whatPlayGaveAsTheMapBeganToRestShowsTheCardWhenTheRestEnds() {
        val manager = CountingReviewManager()
        val requester = PlayReviewRequester(manager, activity.get())
        requester.prepare()
        shadowOf(Looper.getMainLooper()).idle()
        assertEquals(1, manager.asked)
        assertEquals(0, manager.shown.size)

        requester.request()
        shadowOf(Looper.getMainLooper()).idle()
        assertEquals(1, manager.asked)
        assertEquals(1, manager.shown.size)
        assertSame(activity.get(), manager.shown.single().first)

        // The next ask readies its own.
        requester.request()
        shadowOf(Looper.getMainLooper()).idle()
        assertEquals(2, manager.asked)
        assertEquals(2, manager.shown.size)
    }

    @Test
    fun withoutPlaysStoreNothingIsShownOrSaid() {
        val manager = CountingReviewManager { Tasks.forException(IllegalStateException("Play Store app is not installed")) }
        val requester = PlayReviewRequester(manager, activity.get())
        requester.prepare()
        requester.request()
        shadowOf(Looper.getMainLooper()).idle()
        assertEquals(1, manager.asked)
        assertEquals(0, manager.shown.size)
    }

    @Test
    fun anActivityLeftBeforePlayAnsweredShowsNoCard() {
        val answer = TaskCompletionSource<ReviewInfo>()
        val manager = CountingReviewManager { answer.task }
        val requester = PlayReviewRequester(manager, activity.get())
        requester.request()
        activity.pause().stop().destroy()
        answer.setResult(FakeReviewManager(ApplicationProvider.getApplicationContext()).requestReviewFlow().result)
        shadowOf(Looper.getMainLooper()).idle()
        assertEquals(0, manager.shown.size)
    }
}
