package com.plhery.scootradar.ui

import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.text
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.LinkAnnotation
import androidx.compose.ui.text.buildAnnotatedString

// What VoiceOver reads of a text drawn in several styles: its words, and its links. TalkBack 16 reads the styles of
// the text it is given aloud, "start 34 pixels, bold, 22, end 34 pixels" (app-ai's TalkBack pass, X-M19).

/** The text's words and its links, without the styles they are drawn in. */
fun AnnotatedString.spoken(): AnnotatedString = buildAnnotatedString {
    append(text)
    for (range in getLinkAnnotations(0, length)) {
        when (val link = range.item) {
            is LinkAnnotation.Url -> addLink(LinkAnnotation.Url(link.url, linkInteractionListener = link.linkInteractionListener), range.start, range.end)
            is LinkAnnotation.Clickable -> addLink(LinkAnnotation.Clickable(link.tag, linkInteractionListener = link.linkInteractionListener), range.start, range.end)
        }
    }
}

/**
 * A text drawn in several styles, as TalkBack reads it: its words and links only. On the Text itself: its own
 * semantics are applied before its modifier's, which replace them.
 */
fun Modifier.spokenPlainly(text: AnnotatedString): Modifier = semantics { this.text = text.spoken() }
