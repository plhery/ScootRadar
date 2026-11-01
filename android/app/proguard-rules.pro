# The release build's own keep rules, beside proguard-android-optimize.txt and the rules each library ships in its
# AAR or jar: kotlinx.serialization (its generated serializers), kotlinx.coroutines, OkHttp, MapLibre (its JNI
# classes, and Gson's and GeoJSON's it reads by reflection), AppCompat, Compose and the rest of AndroidX
# (app/build/outputs/mapping/release/configuration.txt lists them). Only rules R8 or the minified app on the
# emulator proved needed go here, each with why.
#
# None so far. AGP 9.5's R8 reports no missing class (no missing_rules.txt) and no warning: JTS's java.awt and
# javax.xml.stream classes, which an older R8 asked a -dontwarn for, are not reached from the app. :core's strings
# and catalog are read as Java resources by absolute path, which R8 neither renames nor drops; the open-source
# notices are assets, which are not shrunk; Inter is read through R.font, which the resource shrinker follows.
