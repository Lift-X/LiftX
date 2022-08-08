####################################################################################################
## Build Rust/backend
####################################################################################################

# use cargo-chef to cache dependencies
FROM rust:latest AS chef
RUN cargo install cargo-chef

FROM chef AS planner

WORKDIR /liftx
COPY . /liftx
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS rust_builder
WORKDIR /liftx

COPY --from=planner /liftx/recipe.json recipe.json
# Build dependencies - this is the caching Docker layer!
RUN cargo chef cook --release --recipe-path recipe.json

# Build application
COPY . /liftx
RUN cargo build --release --bin liftx

####################################################################################################
## SvelteKit/frontend
####################################################################################################

FROM node:latest AS node_builder

WORKDIR /liftx

COPY ./ ./

# Install dependencies
# TODO: Move dependencies out of dev-dependencies and try --production (no difference?)
RUN npm install
# Build frontend assets
RUN npm run build

####################################################################################################
## Final image
####################################################################################################
# TODO: Move to distroless, scratch or alpine?
FROM debian:bullseye-slim

# Create appuser
ENV USER=liftx
ENV UID=1000

RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    "${USER}"

WORKDIR /liftx

# Copy our build
COPY --from=rust_builder /liftx/target/release/liftx /liftx/liftx
COPY ./templates /liftx/templates
COPY --from=rust_builder /liftx/Rocket.toml /liftx/Rocket.toml
COPY --from=node_builder /liftx/build /liftx/build
COPY .env .env

RUN touch /liftx/data.db \
    && chown -R "${USER}:${USER}" /liftx \
    && chmod 660 /liftx/data.db

# Expose port 8000
EXPOSE 8000

# Use an unprivileged user.
USER liftx:liftx

CMD ["/liftx/liftx"]
