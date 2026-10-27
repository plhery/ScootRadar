package com.plhery.scootradar.core.model

import java.math.BigDecimal
import java.time.Instant
import java.time.ZoneId
import kotlinx.serialization.KSerializer
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonEncoder
import kotlinx.serialization.json.JsonUnquotedLiteral

// ScooterRidePricing, ProviderRidePass, RideEstimateDuration, RidePriceQuote and RidePriceEstimator from
// ios/ScootRadar/Models/ScooterModels.swift.

data class ScooterRidePricing(
    val currency: String,
    val unlockFeeMinorUnits: Int,
    val minuteFeeMinorUnits: Int,
    /** The operator gives a range a minute, as Lime does in New York, and this is its lowest: "from". */
    val minuteFeeFrom: Boolean = false,
    /** Tax is added to these prices, as US and Canadian operators charge sales tax on top. */
    val plusTax: Boolean = false,
    /**
     * "2026-10-18": the feed publishes no price, and this one was copied from the operator's price list,
     * where it was last checked that day.
     */
    val listedOn: String? = null,
) {
    /** "CHF 1.00 to unlock", or "USD 1.00 to unlock + tax" where tax is added. */
    fun taxed(text: String): String = if (plusTax) stringFormat(localized("%@ + tax"), text) else text

    /** The tariff, followed by when it was checked where it was copied from a price list. */
    fun listed(text: String): String {
        val day = listedOn?.let { RidePriceFormatter.listedDay(it) } ?: return text
        return stringFormat(localized("%1\$@ · published price, checked %2\$@"), text, day)
    }
}

/**
 * A rider's pass with an operator. It is saved as JSON with the keys of the iPhone app's, and its expiry as
 * JSONEncoder writes a Date: seconds since 1 January 2001.
 */
@Serializable
data class ProviderRidePass private constructor(
    val enabled: Boolean,
    val freeUnlock: Boolean,
    val freeMinutes: Int,
    @Serializable(with = ReferenceDateSerializer::class)
    val expiryDate: Instant? = null,
) {
    /**
     * Whether it applies at that instant: until the end of its expiry's day on the phone's calendar. The
     * zone is the calendar's.
     */
    fun isActive(on: Instant = Instant.now(), zone: ZoneId = ScooterDateFormat.timeZone()): Boolean {
        if (!enabled) return false
        val expiryDate = expiryDate ?: return true
        val firstMomentAfterExpiryDay = expiryDate.atZone(zone).toLocalDate().plusDays(1).atStartOfDay(zone).toInstant()
        return on < firstMomentAfterExpiryDay
    }

    companion object {
        operator fun invoke(
            enabled: Boolean = false,
            freeUnlock: Boolean = false,
            freeMinutes: Int = 0,
            expiryDate: Instant? = null,
        ): ProviderRidePass = ProviderRidePass(enabled, freeUnlock, maxOf(0, freeMinutes), expiryDate)
    }
}

/**
 * A Date as JSONEncoder and JSONDecoder write and read it by default: a number, the seconds since
 * 1 January 2001 (UTC).
 */
internal object ReferenceDateSerializer : KSerializer<Instant> {
    /** 2001-01-01T00:00:00Z, Date's reference date, in seconds since 1970. */
    private const val REFERENCE_EPOCH_SECOND = 978_307_200L

    override val descriptor: SerialDescriptor = PrimitiveSerialDescriptor("ReferenceDate", PrimitiveKind.DOUBLE)

    override fun serialize(encoder: Encoder, value: Instant) {
        val seconds = (value.epochSecond - REFERENCE_EPOCH_SECOND) + value.nano / 1e9
        if (encoder is JsonEncoder) {
            // "809737200" as Swift writes it, rather than Kotlin's "8.097372E8".
            encoder.encodeJsonElement(JsonUnquotedLiteral(BigDecimal.valueOf(seconds).withoutTrailingZeros().toPlainString()))
        } else {
            encoder.encodeDouble(seconds)
        }
    }

    override fun deserialize(decoder: Decoder): Instant {
        val seconds = decoder.decodeDouble()
        val whole = kotlin.math.floor(seconds)
        return Instant.ofEpochSecond(REFERENCE_EPOCH_SECOND + whole.toLong(), Math.round((seconds - whole) * 1e9))
    }
}

object RideEstimateDuration {
    val allowedMinutes: List<Int> = listOf(5, 10, 15, 20, 30)
    val defaultMinutes: Int = 10

    fun normalized(minutes: Int): Int = if (minutes in allowedMinutes) minutes else defaultMinutes
}

data class RidePriceQuote(
    val currency: String,
    val durationMinutes: Int,
    val grossMinorUnits: Int,
    val totalMinorUnits: Int,
    val chargedUnlockFeeMinorUnits: Int,
    val billedMinutes: Int,
    val freeMinutesApplied: Int,
    val passApplied: Boolean,
    /** Tax is added to the estimate. */
    val plusTax: Boolean = false,
    /** The minute fee is the lowest of a range, so the estimate is the least the ride costs. */
    val minuteFeeFrom: Boolean = false,
)

object RidePriceEstimator {
    fun quote(
        pricing: ScooterRidePricing,
        durationMinutes: Int,
        pass: ProviderRidePass? = null,
        now: Instant = Instant.now(),
        zone: ZoneId = ScooterDateFormat.timeZone(),
    ): RidePriceQuote {
        val duration = maxOf(0, durationMinutes)
        val unlockFee = maxOf(0, pricing.unlockFeeMinorUnits)
        val minuteFee = maxOf(0, pricing.minuteFeeMinorUnits)
        val grossMinorUnits = totalMinorUnits(unlockFee = unlockFee, minuteFee = minuteFee, billedMinutes = duration)

        val activePass = pass?.takeIf { it.isActive(on = now, zone = zone) }
        val billedMinutes = maxOf(0, duration - maxOf(0, activePass?.freeMinutes ?: 0))
        val chargedUnlockFee = if (activePass?.freeUnlock == true) 0 else unlockFee
        val totalMinorUnits = totalMinorUnits(unlockFee = chargedUnlockFee, minuteFee = minuteFee, billedMinutes = billedMinutes)

        return RidePriceQuote(
            currency = pricing.currency,
            durationMinutes = duration,
            grossMinorUnits = grossMinorUnits,
            totalMinorUnits = totalMinorUnits,
            chargedUnlockFeeMinorUnits = chargedUnlockFee,
            billedMinutes = billedMinutes,
            freeMinutesApplied = duration - billedMinutes,
            passApplied = totalMinorUnits < grossMinorUnits,
            plusTax = pricing.plusTax,
            minuteFeeFrom = pricing.minuteFeeFrom,
        )
    }

    /** Int.MAX_VALUE where the sum would not fit, rather than a total that wrapped round. */
    private fun totalMinorUnits(unlockFee: Int, minuteFee: Int, billedMinutes: Int): Int {
        val minuteTotal = try {
            Math.multiplyExact(minuteFee, billedMinutes)
        } catch (_: ArithmeticException) {
            return Int.MAX_VALUE
        }
        return try {
            Math.addExact(unlockFee, minuteTotal)
        } catch (_: ArithmeticException) {
            Int.MAX_VALUE
        }
    }
}
