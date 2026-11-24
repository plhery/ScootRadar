"""Reject an APK that a published F-Droid v2 index can't take: one older than the newest ScootRadar it lists, or one of a
version code it lists already with another APK.

    check-fdroid-version.py <versionCode> <the APK's SHA-256> < index-v2.json
"""
import json
import sys

code = int(sys.argv[1])
sha256 = sys.argv[2].lower()
package = json.load(sys.stdin)["packages"].get("com.plhery.scootradar")
versions = package["versions"] if package is not None else {}
newest = max((version["manifest"]["versionCode"] for version in versions.values()), default=None)
if newest is not None and code < newest:
    sys.exit(f"Version {newest} is already published")
# The same version code goes through with the same APK, so that a run cut off is run again to the end. With another
# APK, as when it was built again from another commit or signed in a way that isn't reproducible, the index would take
# it while GitHub's release on the same tag keeps the first and refuses it (publish-github-release.sh): F-Droid and
# GitHub would serve two files under one tag, and every run again would stop at GitHub the same way (week review of
# 24 November 2026, A1). The index keeps each version under its APK's SHA-256, which its file names again.
for key, version in versions.items():
    if version["manifest"]["versionCode"] != code:
        continue
    listed = version.get("file", {}).get("sha256", key).lower()
    if listed != sha256:
        sys.exit(f"Version {code} is already published with another APK (SHA-256 {listed}; this one's is {sha256}):"
                 " publish the same APK again, or build this one with a new versionCode")
