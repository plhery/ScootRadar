package com.plhery.scootradar.core.api

import kotlinx.serialization.json.Json

/**
 * Reads the server's answers as the iPhone app's JSONDecoder does: keys it does not know are skipped, while
 * a missing required key, a null where none may be, or a status or mode it does not know fails the answer.
 */
val ScooterAPIJson: Json = Json {
    ignoreUnknownKeys = true
}
