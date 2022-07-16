####################################################################################################
## Build Rust/backend
####################################################################################################

# use cargo-chef to cache dependencies
FROM rust:latest AS chef
RUN cargo install cargo-chef

FROM chef AS planner

WORKDIR /wlrs
COPY . /wlrs
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS rust_builder
WORKDIR /wlrs

COPY --from=planner /wlrs/recipe.json recipe.json
# Build dependencies - this is the caching Docker layer!
RUN cargo chef cook --release --recipe-path recipe.json

# Build application
COPY . /wlrs
RUN cargo build --release --bin wlrs

####################################################################################################
## SvelteKit/frontend
####################################################################################################

FROM node:latest AS node_builder

WORKDIR /wlrs

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
ENV USER=wlrs
ENV UID=1000

RUN adduser \
    --disabled-password \
    --gecos "" \
    --home "/nonexistent" \
    --shell "/sbin/nologin" \
    --no-create-home \
    --uid "${UID}" \
    "${USER}"

WORKDIR /wlrs

# Copy our build
COPY --from=rust_builder /wlrs/target/release/wlrs /wlrs/wlrs
COPY ./templates /wlrs/templates
COPY --from=rust_builder /wlrs/Rocket.toml /wlrs/Rocket.toml
COPY --from=node_builder /wlrs/build /wlrs/build
COPY .env .env

RUN touch /wlrs/data.db \
    && chown -R "${USER}:${USER}" /wlrs \
    && chmod 660 /wlrs/data.db

# Expose port 8000
EXPOSE 8000

# Use an unprivileged user.
USER wlrs:wlrs

CMD ["/wlrs/wlrs"]