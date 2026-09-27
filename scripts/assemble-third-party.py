#!/usr/bin/env python3
"""Assemble the three third_party jars ClassyShark compiles against.

asmdex-1.0 / util-2.0.6 / java-binutils are 2013-era libraries that:
  * are NOT committed by upstream (only LICENSE files),
  * are NOT on Maven Central,
  * asmdex's OW2 download site is dead, util has no public source,
    java-binutils has no root pom to build from source.

The single reliable source that contains exactly the versions ClassyShark
compiles against is the official upstream "fat jar" release on the GitHub
release CDN. This script downloads that jar and repackages the three libraries
out of it into the flatDir jars the build.gradle declares.

Fast path: if all three jars already exist under third_party/, they are used
as-is and nothing is downloaded.

The asmdex / java-binutils package roots are constants below. If a first run
reports an empty jar, print the discovered package roots and tell the
maintainer to update PACKAGE_ROOTS.
"""

import argparse
import io
import pathlib
import sys
import urllib.request
import zipfile

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
THIRD_PARTY = REPO_ROOT / "third_party"

UPSTREAM = "https://github.com/google/android-classyshark/releases/download/8.2/ClassyShark.jar"

# package root (inside a jar, with trailing '/') -> target third_party jar name
PACKAGE_ROOTS = {
    "org/objectweb/asmdex/": "asmdex-1.0.jar",
    "com/jawi/":             "java-binutils.jar",
    "net/jawi/":             "java-binutils.jar",
    "org/jawi/":             "java-binutils.jar",
    # everything else that is neither ClassyShark nor Maven-Central is util
}

MAVEN_CENTRAL_ROOTS = {
    "org/ow2/asm/", "org/smali/", "org/apache/bcel/",
    "com/google/gson/", "com/google/guava/", "com/squareup/",
    "org/jetbrains/", "org/codehaus/mojo/", "org/slf4j/",
    "okhttp3/", "okio/", "retrofit2/", "org/intellij/",
}
APP_ROOT = "com/google/classyshark/"


def fetch_upstream() -> bytes:
    print(f"[assemble] downloading upstream jar: {UPSTREAM}")
    req = urllib.request.Request(UPSTREAM, headers={"User-Agent": "assemble-third-party"})
    with urllib.request.urlopen(req, timeout=300) as resp:
        return resp.read()


def classify(name: str) -> str | None:
    """Return the target jar filename for an entry, or None to skip."""
    if name.endswith("/") or name.startswith("META-INF/") or not name.endswith(".class"):
        return None
    if name.startswith(APP_ROOT):
        return None
    for root, jar in PACKAGE_ROOTS.items():
        if name.startswith(root):
            return jar
    # not classyshark, not an explicit known lib: it is util (author-internal)
    for root in MAVEN_CENTRAL_ROOTS:
        if name.startswith(root):
            return None
    return "util-2.0.6.jar"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--keep-upstream", default=None,
                    help="path to a pre-downloaded upstream jar (for local testing)")
    args = ap.parse_args()

    THIRD_PARTY.mkdir(parents=True, exist_ok=True)
    need = [f"{THIRD_PARTY}/{n}" for n in
            ("asmdex-1.0.jar", "util-2.0.6.jar", "java-binutils.jar")]
    if all(pathlib.Path(p).is_file() for p in need):
        print("[assemble] all three third_party jars already present; using committed jars.")
        for p in need:
            print(f"  {p}")
        return 0

    if args.keep_upstream:
        data = pathlib.Path(args.keep_upstream).read_bytes()
    else:
        data = fetch_upstream()

    # group entries per target jar
    groups = {"asmdex-1.0.jar": [], "util-2.0.6.jar": [], "java-binutils.jar": []}
    skipped_roots = {}
    with zipfile.ZipFile(io.BytesIO(data)) as zf:
        for info in zf.infolist():
            name = info.filename
            jar = classify(name)
            if jar is None:
                if name.startswith(APP_ROOT):
                    continue
                if name.endswith(".class"):
                    root = name.split("/")[0]
                    skipped_roots.setdefault(root, 0)
                    skipped_roots[root] += 1
                continue
            groups[jar].append((name, zf.read(info)))

    # verify none are empty
    ok = True
    for jar, entries in groups.items():
        if not entries:
            ok = False
            print(f"[assemble] ERROR: no classes classified into {jar}. "
                  f"PACKAGE_ROOTS needs updating.")
    if not ok:
        print("[assemble] top-level non-ClassyShark class roots found in upstream jar:")
        for root, n in sorted(skipped_roots.items(), key=lambda kv: -kv[1])[:25]:
            print(f"  {n:6d}  {root}/")
        print("[assemble] Update PACKAGE_ROOTS in scripts/assemble-third-party.py "
              "to map these roots to the correct jar, then re-run.")
        return 1

    for jar, entries in groups.items():
        out = THIRD_PARTY / jar
        with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as zf:
            for name, content in entries:
                zf.writestr(name, content)
        print(f"[assemble] wrote {out} ({len(entries)} entries)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
