"""Reject an APK older than the newest ScootRadar in a published F-Droid v2 index."""
import json
import sys

package = json.load(sys.stdin)["packages"].get("com.plhery.scootradar")
versions = package["versions"] if package is not None else {}
newest = max((version["manifest"]["versionCode"] for version in versions.values()), default=None)
if newest is not None and int(sys.argv[1]) < newest:
    sys.exit(f"Version {newest} is already published")
