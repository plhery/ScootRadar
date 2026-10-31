package com.plhery.scootradar.ui.theme

import android.animation.ValueAnimator
import android.database.ContentObserver
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.ContentTransform
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.Easing
import androidx.compose.animation.core.FiniteAnimationSpec
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Box
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import com.plhery.scootradar.core.IosMotion
import com.plhery.scootradar.core.SpringSpec
import com.plhery.scootradar.core.TimingCurve

// SwiftUI's animations in ios/ScootRadar/Views, in Compose's terms (PLAN §7, ui.md §4).

/** The spring Compose runs for one of SwiftUI's. */
fun <T> SpringSpec.animation(visibilityThreshold: T? = null): androidx.compose.animation.core.SpringSpec<T> =
    spring(dampingRatio = dampingRatio, stiffness = stiffness, visibilityThreshold = visibilityThreshold)

/** The curve Compose eases along for one of Core Animation's. */
val TimingCurve.easing: Easing get() = CubicBezierEasing(x1, y1, x2, y2)

/** `.easeInOut(duration:)` and `.easeOut(duration:)` as tweens. */
fun <T> IosMotion.easeInOut(duration: Double = IosMotion.DEFAULT_DURATION): FiniteAnimationSpec<T> =
    tween(durationMillis = (duration * 1000).toInt(), easing = easeInOut.easing)

fun <T> IosMotion.easeOut(duration: Double = IosMotion.DEFAULT_DURATION): FiniteAnimationSpec<T> =
    tween(durationMillis = (duration * 1000).toInt(), easing = easeOut.easing)

/**
 * Whether the phone asks for less motion, as iOS's Reduce Motion: Android's "Remove animations", which sets the
 * animator duration scale to 0. Tests set it directly.
 */
val LocalReduceMotion = staticCompositionLocalOf { false }

/** The spring for a change, or none under Reduce Motion, where the iPhone app's animations are nil. */
@Composable
@ReadOnlyComposable
fun <T> motion(spring: SpringSpec): FiniteAnimationSpec<T> =
    if (LocalReduceMotion.current) snap() else spring.animation()

/** Whether animations are off on the phone, read again when the setting changes. */
@Composable
fun reduceMotionSetting(): Boolean {
    val context = LocalContext.current
    val resolver = context.contentResolver
    // ValueAnimator's own scale, which power saver may also take to 0, catches up after the setting does.
    fun animationsOff() = !ValueAnimator.areAnimatorsEnabled() ||
        Settings.Global.getFloat(resolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f
    val off = remember { mutableStateOf(animationsOff()) }
    DisposableEffect(resolver) {
        val observer = object : ContentObserver(Handler(Looper.getMainLooper())) {
            override fun onChange(selfChange: Boolean) {
                off.value = animationsOff()
            }
        }
        resolver.registerContentObserver(Settings.Global.getUriFor(Settings.Global.ANIMATOR_DURATION_SCALE), false, observer)
        onDispose { resolver.unregisterContentObserver(observer) }
    }
    return off.value
}

/**
 * AnimatedContent, or with [atOnce] (Reduce Motion, where the iPhone's animation is nil, or a count that doesn't roll)
 * the new content in the frame [targetState] changes, as [ContentAtOnce]: AnimatedContent with no transition and a
 * snapped size still draws the old content until its transition has run, a frame or more (UI-184). A change of
 * [atOnce] while a content shows starts it afresh, its state with it.
 */
@Composable
fun <S> ChangingContent(
    targetState: S,
    atOnce: Boolean,
    modifier: Modifier = Modifier,
    transitionSpec: AnimatedContentTransitionScope<S>.() -> ContentTransform,
    contentAlignment: Alignment = Alignment.TopStart,
    label: String,
    contentKey: (S) -> Any? = { it },
    content: @Composable (S) -> Unit,
) {
    if (atOnce) {
        ContentAtOnce(targetState, modifier, contentAlignment, contentKey, content)
    } else {
        AnimatedContent(targetState, modifier, transitionSpec, contentAlignment, label, contentKey) { content(it) }
    }
}

/**
 * [content] for [state], laid out as AnimatedContent lays out one content (the constraints passed on, the content's
 * nodes at its top start, the content at [contentAlignment]), with its own state for each [contentKey], as there.
 */
@Composable
fun <S> ContentAtOnce(
    state: S,
    modifier: Modifier = Modifier,
    contentAlignment: Alignment = Alignment.TopStart,
    contentKey: (S) -> Any? = { it },
    content: @Composable (S) -> Unit,
) {
    Box(modifier, contentAlignment = contentAlignment, propagateMinConstraints = true) {
        key(contentKey(state)) {
            Box(propagateMinConstraints = true) { content(state) }
        }
    }
}
