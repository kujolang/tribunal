#!/usr/bin/env bash
# Resolve immutable release source without changing the protected workflow ref.
set -euo pipefail
workflow_revision="$(git rev-parse "${GITHUB_SHA:?}^{commit}")"
expected_tag="v$(tr -d '\r\n' < VERSION)"
source_revision="$workflow_revision"
if [[ "${PUBLISH_RELEASE:-false}" == true ]]; then
  [[ "${GITHUB_REF:?}" == refs/heads/main ]] || { echo 'Publication must be dispatched from protected main' >&2; exit 1; }
  [[ "${RELEASE_TAG:-}" == "$expected_tag" ]] || { echo 'Release tag must match VERSION' >&2; exit 1; }
  source_revision="$(git rev-parse --verify "refs/tags/$RELEASE_TAG^{commit}")"
  git merge-base --is-ancestor "$source_revision" "$workflow_revision" || { echo 'Release source must be merged into workflow main' >&2; exit 1; }
  [[ "v$(git show "$source_revision:VERSION" | tr -d '\r\n')" == "$RELEASE_TAG" ]] || { echo 'Tagged VERSION does not match release tag' >&2; exit 1; }
elif [[ "${GITHUB_REF:-}" == refs/tags/* ]]; then
  [[ "${GITHUB_REF#refs/tags/}" == "$expected_tag" ]] || { echo 'Tag ref must match VERSION' >&2; exit 1; }
  [[ "$(git rev-parse --verify "$GITHUB_REF^{commit}")" == "$workflow_revision" ]] || { echo 'Tag ref must match workflow source' >&2; exit 1; }
fi
printf 'revision=%s\n' "$source_revision"
