package com.plhery.scootradar.ui

import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaExtractor
import android.media.MediaFormat
import java.io.File
import kotlin.math.abs

/**
 * A frame of a film `screenrecord` made, which writes one only as the screen changes: when it shows, in milliseconds
 * from the film's first, and how many of the film's points (one in [STEP] across and down, between [top] and [bottom]
 * as shares of its height) differ from the frame before it by more than [LUMA] levels of grey.
 */
internal class FilmFrame(val millis: Double, val changed: Int)

/**
 * The frames of the film in [file], each compared with the one before it, the first left out. Decoded as the device
 * plays it, to its grey only; the rows above [top] and below [bottom], the system's bars, are left out.
 */
internal fun filmFrames(file: File, top: Float, bottom: Float): List<FilmFrame> {
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
                val grey = codec.getOutputImage(output)!!.use { image ->
                    val plane = image.planes[0]
                    val crop = image.cropRect
                    val from = crop.top + (crop.height() * top).toInt()
                    val to = crop.top + (crop.height() * bottom).toInt()
                    val buffer = plane.buffer
                    val points = IntArray(((to - from + STEP - 1) / STEP) * ((crop.width() + STEP - 1) / STEP))
                    var i = 0
                    for (y in from until to step STEP) {
                        for (x in crop.left until crop.right step STEP) {
                            points[i++] = buffer.get(y * plane.rowStride + x * plane.pixelStride).toInt() and 0xFF
                        }
                    }
                    points
                }
                val start = first ?: info.presentationTimeUs.also { first = it }
                before?.let { previous ->
                    val changed = grey.indices.count { abs(grey[it] - previous[it]) > LUMA }
                    frames += FilmFrame((info.presentationTimeUs - start) / 1000.0, changed)
                }
                before = grey
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
