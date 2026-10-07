# Build only from the small context documented in WORKCELL_REVIEW.md.
# Pin the Ubuntu amd64 manifest; the installer separately pins official Kujo bytes.
FROM ubuntu:24.04@sha256:f610ab94648195aa356059f5b41d6085c9d4d903c072430cdd1af7bdb646106b AS runtime-download
RUN apt-get update && apt-get install -y --no-install-recommends python3 ca-certificates libssl3t64 \
    && rm -rf /var/lib/apt/lists/*
COPY scripts/install_ci_runtime.py /build/scripts/install_ci_runtime.py
COPY docs/INTEGRATION_MATRIX.json /build/docs/INTEGRATION_MATRIX.json
RUN python3 /build/scripts/install_ci_runtime.py --platform linux-x86_64 --destination /out/kujo

FROM ubuntu:24.04@sha256:f610ab94648195aa356059f5b41d6085c9d4d903c072430cdd1af7bdb646106b
RUN apt-get update && apt-get install -y --no-install-recommends bash ca-certificates openssl unzip \
    && rm -rf /var/lib/apt/lists/*
COPY --from=runtime-download /out/kujo /usr/local/bin/kujo
RUN test "$(kujo --version)" = "kujo 1.5.0"
LABEL org.opencontainers.image.revision="cc2d7dbb59a8dc05f00d629e100932f56f4062f6" \
      org.opencontainers.image.version="1.5.0" \
      org.opencontainers.image.source="https://github.com/kujolang/kujo"
USER 65532:65532
