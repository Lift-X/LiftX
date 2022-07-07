//#![forbid(unsafe_code)]
// Use all clippy lints (just to get an idea)
#![warn(clippy::all, clippy::pedantic)]
#![deny(
    bad_style,
    const_err,
    dead_code,
    improper_ctypes,
    non_shorthand_field_patterns,
    no_mangle_generic_items,
    overflowing_literals,
    path_statements,
    patterns_in_fns_without_body,
    private_in_public,
    unconditional_recursion,
    unused_allocation,
    unused_comparisons,
    unused_parens,
    while_true
)]
#[macro_use]
extern crate rocket;
mod api;
pub mod cache;
pub mod database;
pub mod equipment;
pub mod error;
mod exercises;
pub mod handlers;
#[cfg(test)]
mod tests;
pub mod util;

#[allow(unused_imports)]
use crate::{database::create_connection, equipment::Weight};
use rocket::{Build, Rocket};
use rocket_db_pools::Database;
use rocket_governor::{rocket_governor_catcher, Method, Quota, RocketGovernable};
use sqlx::{Pool, Sqlite, SqlitePool};

// Rate Limiting
/// Usage:
/// ```rust
/// fn route(_limitguard: RocketGovernor<'_, RateLimitGuard>)...
/// ```
/// This might cause issues if the server is, for example routed through cloudflare. Suggest users look into: https://support.cloudflare.com/hc/en-us/articles/200170786-Restoring-original-visitor-IPs
pub struct RateLimitGuard;
impl<'r> RocketGovernable<'r> for RateLimitGuard {
    fn quota(_method: Method, _route_name: &str) -> Quota {
        match _route_name {
            "post_register" => Quota::per_hour(Self::nonzero(10)),
            "post_login" => Quota::per_hour(Self::nonzero(10)),
            "post_workout_json" => Quota::per_hour(Self::nonzero(5)),
            _ => Quota::per_second(Self::nonzero(10u32)),
        }
    }
}

// Move to enviroment variable/config file once release-ready
const PROD: bool = true;

#[rocket::main]
async fn main() {
    flexi_logger::Logger::try_with_env_or_str("info")
        .unwrap()
        .start()
        .unwrap();
    // connect to DB
    let conn: Result<Pool<Sqlite>, sqlx::Error> = SqlitePool::connect("data.db").await;
    match conn {
        Ok(conn) => {
            // Initialize Database tables if they don't exist
            database::build_tables(&conn).await;
            let users: rocket_auth::Users = conn.clone().into();
            log::info!("Database connection successful");
            launch_web(conn, users).await;
        }
        Err(e) => {
            panic!("Database connection failed: {}", e);
        }
    }
}

/// Launch the rocket web server.
/// Policies: no mime sniffing, xss filtering, no ref
async fn launch_web(conn: sqlx::SqlitePool, users: rocket_auth::Users) {
    // launch web server
    let shield = rocket::shield::Shield::default()
        .enable(rocket::shield::Referrer::NoReferrer)
        .enable(rocket::shield::XssFilter::EnableBlock)
        .enable(rocket::shield::NoSniff::Enable);
    #[allow(clippy::no_effect_underscore_binding)]
    let rocket: Rocket<Build> = rocket::build()
        .attach(shield)
        .attach(database::Db::init())
        .mount(
            "/",
            routes![
                crate::handlers::get_app,
                crate::handlers::get_asset,
                crate::handlers::frontpage,
                crate::handlers::workout_view,
                crate::handlers::workout_new,
                crate::handlers::register,
                crate::handlers::signup_redirect,
                crate::handlers::login,
                crate::handlers::logout,
                crate::handlers::home,
                crate::handlers::settings
            ],
        )
        .mount(
            "/api",
            routes![
                crate::api::workout_json,
                crate::api::workout_delete,
                crate::api::post_workout_json,
                crate::api::post_register,
                crate::api::post_login,
                crate::api::get_current_user,
                crate::api::get_user_workouts,
                crate::api::get_user_workouts_dynamic,
                crate::api::get_user_workouts_recent,
                crate::api::get_exercises_list,
                crate::api::get_graph_volume,
                crate::api::get_graph_frequent,
                crate::api::get_user_settings
            ],
        )
        .register("/", catchers![crate::handlers::general_404])
        .register("/", catchers![rocket_governor_catcher])
        .manage(conn)
        .manage(users);
    let rocket = rocket.launch().await;

    match rocket {
        Ok(_) => {
            log::info!("Rocket web server started");
        }
        Err(e) => {
            log::error!("Rocket server failed to start: {}", e);
        }
    }
}
