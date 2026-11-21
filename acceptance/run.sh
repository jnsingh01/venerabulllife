#!/usr/bin/env bash
# One acceptance run of a Venerabull Life release candidate on a hosted runner. It waits for nothing and retries
# nothing, and it publishes nothing. Two modes, never mixed:
#
#   PW_MODULE=<playwright-core/index.mjs> bash acceptance/run.sh OUT            the candidate mode
#   PW_MODULE=<playwright-core/index.mjs> bash acceptance/run.sh OUT live       the live mode
#
# The candidate mode runs the release route's five steps on the candidate's exact site/ tree, the package served by a
# static server on this runner. It is proof of the package, never proof of the live site:
#   1  node tools/generate.js --check        the hand-written regions equal what the markup writes
#   2  python3 -I tools/check.py             static checks of site/
#   3  python3 -I tools/release.py build     the package (site/ at this commit, from git blobs) and its scan
#   4  node tools/verify-release.mjs         the package served alone: pages at 1440 and 390, the menu, no scripts,
#                                            every retired address, every file's bytes
#   5  python3 -I tools/release.py manifest  hashes, the scan, that report and the binding to the pinned tree
# The live mode is selected only by its own branch, after publication. It refuses unless the published branch's tree
# is the pinned publish tree (the candidate's files plus the host's CNAME and .nojekyll), then fetches the published
# site at the pinned origin: every file's bytes, every retired address, and the pages, menu and no-scripts checks and
# captures at 1440 and 390 (step L, tools/verify-release.mjs --live).
#
# Both refuse (exit 2, nothing run) unless this commit's site/ is the pinned tree (acceptance/pin.json), the pinned host
# commit is present and nothing is uncommitted. Exit: 0 passed; 2 refused; 11-15 the candidate step that failed; 21 the
# live step failed. OUT keeps every step's log, the reports, the captures, BINDING.txt and SHA256SUMS of them all.
set -u -o pipefail
OUT="${1:-}"; MODE="${2:-candidate}"
[ -n "$OUT" ] && { [ "$MODE" = candidate ] || [ "$MODE" = live ]; } || { echo "usage: bash acceptance/run.sh OUT [live]"; exit 2; }
cd "$(dirname "$0")/.." || exit 2
mkdir -p "$OUT" && OUT="$(cd "$OUT" && pwd)" || exit 2
pin() { python3 -I -c 'import json, sys; v = json.load(open(sys.argv[1], encoding="utf-8"))
for k in sys.argv[2].split("."): v = v[k]
print(v)' acceptance/pin.json "$1"; }
REV=$(git rev-parse HEAD) && TREE=$(git rev-parse HEAD:site) && WANT=$(pin site_tree) && BASE=$(pin host_base) && CAND=$(pin candidate) || exit 2

finish() {   # $1: the exit code. Keep what exists, fingerprint it, summarise, exit.
  local short="${REV:0:7}"
  if [ "$MODE" = candidate ]; then
    cp -p "release/venerabulllife.com-$short.SCAN.json" "release/venerabulllife.com-$short.MANIFEST.txt" "$OUT/" 2>/dev/null
  fi
  echo "finished:                 $(date -u '+%Y-%m-%d %H:%M:%S UTC'), exit $1" >> "$OUT/BINDING.txt"
  (cd "$OUT" && find . -type f ! -name SHA256SUMS | LC_ALL=C sort | xargs -d '\n' sha256sum > SHA256SUMS)
  local verdict; [ "$1" -eq 0 ] && verdict="ACCEPT ($MODE)" || verdict="NOT ACCEPTED ($MODE, exit $1)"
  if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
    { echo "### Venerabull Life acceptance: $verdict"; echo; echo '```'; cat "$OUT/BINDING.txt"; echo '```'; } >> "$GITHUB_STEP_SUMMARY"
  fi
  echo "$verdict"
  exit "$1"
}
refuse() { echo "REFUSED: $1; nothing run" | tee -a "$OUT/BINDING.txt"; finish 2; }

{
  if [ "$MODE" = live ]; then
    echo "mode:                     live: the published site at $(pin live.origin), held to the candidate's files"
  else
    echo "mode:                     candidate: the package served by a static server on this runner (not proof of the live site)"
  fi
  echo "commit (this run):        $REV"
  echo "candidate:                $CAND"
  echo "site tree here / pinned:  $TREE / $WANT"
  echo "published host base:      $BASE"
  echo "term scans:               made privately on the same pinned site tree; not part of this public run"
  echo "runner:                   ${ImageOS:-unknown} ${ImageVersion:-unknown}; run ${GITHUB_RUN_ID:-none}, attempt ${GITHUB_RUN_ATTEMPT:-1}"
  echo "tools:                    node $(node --version), $(python3 --version 2>&1), $(git --version)"
  echo "started:                  $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
} | tee "$OUT/BINDING.txt"
[ "$TREE" = "$WANT" ] || refuse "site/ here is not the pinned tree"
git cat-file -e "$BASE^{commit}" 2>/dev/null || refuse "the pinned host commit is not present"
[ -z "$(git status --porcelain)" ] || refuse "uncommitted changes"

step() {   # step N CODE command...: run it, log it, stop at the first failure
  local n="$1" code="$2"; shift 2
  echo "== step $n: $*"
  "$@" 2>&1 | tee "$OUT/step-$n.log"
  local s="${PIPESTATUS[0]}"
  echo "step $n exit $s: $*" >> "$OUT/BINDING.txt"
  [ "$s" -eq 0 ] || finish "$code"
}

if [ "$MODE" = live ]; then
  PUB_REF="refs/remotes/origin/$(pin live.branch)"
  PUB=$(git rev-parse --verify "$PUB_REF^{commit}" 2>/dev/null) || refuse "the published branch $(pin live.branch) was not fetched"
  PUB_TREE=$(git rev-parse "$PUB^{tree}") && PIN_PUB=$(pin live.publish_tree) || refuse "the publish tree could not be read"
  echo "published branch:         $(pin live.branch) at $PUB, tree $PUB_TREE (pinned $PIN_PUB)" | tee -a "$OUT/BINDING.txt"
  [ "$PUB_TREE" = "$PIN_PUB" ] || refuse "the published branch is not the pinned publish tree (publish the candidate first)"
  step L 21 node tools/verify-release.mjs --live "$(pin live.origin)" --rev "$REV" --base "$BASE" --out "$OUT/live"
  finish 0
fi

step 1 11 node tools/generate.js --check
step 2 12 python3 -I tools/check.py
step 3 13 python3 -I tools/release.py build --rev "$REV"
step 4 14 node tools/verify-release.mjs --rev "$REV" --base "$BASE" --out "$OUT/verify"
step 5 15 python3 -I tools/release.py manifest --rev "$REV" --verify "$OUT/verify/report.json"
finish 0
