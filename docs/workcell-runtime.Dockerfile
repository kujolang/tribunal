ARG KUJO_BASE_IMAGE=kujolang/workcell-kujo:tribunal-v1-9b77dce
FROM ${KUJO_BASE_IMAGE}

# The supported packaged launcher uses /usr/bin/env bash. Keep the shell
# dependency explicit in the proof image rather than bypassing the launcher.
USER root
RUN apk add --no-cache bash=5.2.37-r0
USER 65532:65532
