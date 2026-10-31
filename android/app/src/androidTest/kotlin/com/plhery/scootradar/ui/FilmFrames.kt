package com.plhery.scootradar.ui

import android.graphics.Rect
import android.graphics.RectF
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaExtractor
import android.media.MediaFormat
import java.io.File
import kotlin.math.abs
import kotlin.math.max

/**
 * A frame of a film `screenrecord` made, which writes one only as the screen changes: when it shows, in milliseconds
 * from the film's first, and how many of the film's points (one in [STEP] across and down, between [top] and [bottom]
 * as shares of its height, the marker's square left out) differ from the frame before it by more than [LUMA] levels
 * of grey, and by more than [FAINT_LUMA] ([faint]); and whether the marker's square turned from black to white or
 * back in it ([marker]).
 */
internal class FilmFrame(val millis: Double, val changed: Int, val faint: Int = 0, val marker: Boolean = false)

/**
 * The frames of the film in [file], each compared with the one before it, the first left out. Decoded as the device
 * plays it, to its grey only; the rows above [top] and below [bottom], the system's bars, are left out, and the
 * square [marker] (shares of the film's width and height) is read apart.
 */
internal fun filmFrames(file: File, top: Float, bottom: Float, marker: RectF? = null): List<FilmFrame> {
    val extractor = MediaExtractor()
    extractor.setDataSource(file.path)
    val track = (0 until extractor.trackCount).first { extractor.getTrackFormat(it).getString(MediaFormat.KEY_MIME)!!.startsWith("video/") }
    extractor.selectTrack(track)
    val format = extractor.getTrackFormat(track)
    format.setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatYUV420Flexible)
    val codec = MediaCodec.createDecoderByType(format.getString(MediaFormat.KEY_MIME)!!)
    codec.configure(format, null, null, 0)
    codec.start()
    val frames = mutableListOf<FilmFrame>()
    try {
        val info = MediaCodec.BufferInfo()
        var fed = false
        var first: Long? = null
        var before: IntArray? = null
        var shadeBefore = 0.0
        while (true) {
            if (!fed) {
                val input = codec.dequeueInputBuffer(10_000)
                if (input >= 0) {
                    val size = extractor.readSampleData(codec.getInputBuffer(input)!!, 0)
                    if (size < 0) {
                        codec.queueInputBuffer(input, 0, 0, 0, MediaCodec.BUFFER_FLAG_END_OF_STREAM)
                        fed = true
                    } else {
                        codec.queueInputBuffer(input, 0, size, extractor.sampleTime, 0)
                        extractor.advance()
                    }
                }
            }
            val output = codec.dequeueOutputBuffer(info, 10_000)
            if (output < 0) continue
            if (info.size > 0) {
                var shade = 0.0
                val grey = codec.getOutputImage(output)!!.use { image ->
                    val plane = image.planes[0]
                    val crop = image.cropRect
                    val from = crop.top + (crop.height() * top).toInt()
                    val to = crop.top + (crop.height() * bottom).toInt()
                    val buffer = plane.buffer
                    fun at(x: Int, y: Int) = buffer.get(y * plane.rowStride + x * plane.pixelStride).toInt() and 0xFF
                    // The marker's square, a little inside its edges, which the encoder blurs.
                    val square = marker?.let {
                        val inset = 0.2f * it.width() * crop.width()
                        Rect(
                            (crop.left + it.left * crop.width() + inset).toInt(), (crop.top + it.top * crop.height() + inset).toInt(),
                            (crop.left + it.right * crop.width() - inset).toInt(), (crop.top + it.bottom * crop.height() - inset).toInt(),
                        )
                    }
                    if (square != null) {
                        var sum = 0L
                        for (y in square.top until square.bottom) for (x in square.left until square.right) sum += at(x, y)
                        shade = sum.toDouble() / max(1, square.width() * square.height())
                    }
                    // Its edges too are left out of the screen's points.
                    val around = marker?.let {
                        Rect(
                            (crop.left + it.left * crop.width()).toInt() - STEP * 2, (crop.top + it.top * crop.height()).toInt() - STEP * 2,
                            (crop.left + it.right * crop.width()).toInt() + STEP * 2, (crop.top + it.bottom * crop.height()).toInt() + STEP * 2,
                        )
                    }
                    val points = IntArray(((to - from + STEP - 1) / STEP) * ((crop.width() + STEP - 1) / STEP))
                    var i = 0
                    for (y in from until to step STEP) {
                        for (x in crop.left until crop.right step STEP) {
                            // Out of the count: a point that never changes.
                            points[i++] = if (around != null && around.contains(x, y)) 0 else at(x, y)
                        }
                    }
                    points
                }
                val start = first ?: info.presentationTimeUs.also { first = it }
                before?.let { previous ->
                    val changed = grey.indices.count { abs(grey[it] - previous[it]) > LUMA }
                    val faint = grey.indices.count { abs(grey[it] - previous[it]) > FAINT_LUMA }
                    val flipped = marker != null && abs(shade - shadeBefore) > MARKER_LUMA
                    frames += FilmFrame((info.presentationTimeUs - start) / 1000.0, changed, faint, flipped)
                }
                before = grey
                shadeBefore = shade
            }
            codec.releaseOutputBuffer(output, false)
            if (info.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM != 0) break
        }
    } finally {
        codec.stop()
        codec.release()
        extractor.release()
    }
    return frames
}

/** One point in this many across and down. */
private const val STEP = 2

/** The levels of grey a point must change by: more than the encoder's own changes to a still screen. */
private const val LUMA = 32

/** A fainter change, which the encoder's own changes reach too: only counted, to be logged. */
private const val FAINT_LUMA = 12

/** How far the marker's square's grey must move for it to have turned: half the way from black to white. */
private const val MARKER_LUMA = 110
