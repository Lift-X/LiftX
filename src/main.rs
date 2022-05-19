#![forbid(unsafe_code)]
#[macro_use]
extern crate rocket;

mod api;
pub mod database;
pub mod equipment;
mod exercises;
pub mod handlers;
pub mod muscles;
#[cfg(test)]
mod tests;
pub mod util;

use rocket_db_pools::Database;
use sqlx::ConnectOptions;

#[allow(unused_imports)]
use crate::{database::create_connection, equipment::Weight};

#[rocket::main]
async fn main() {
    // connect to DB
    let conn =
        <sqlx::sqlite::SqliteConnectOptions as std::str::FromStr>::from_str("sqlite://data.db")
            .unwrap()
            .create_if_missing(true)
            .connect().await;

    match conn {
        Ok(conn) => {
            // Initialize database tables, if not already present
            database::build_tables(conn).await;
            info!("Database connection successful");
        }
        Err(e) => {
            error!("Database connection failed: {}", e);
        }
    }

    // As the name implies, launch the rocket web server
    launch_web().await;
}

/// Launch the rocket web server
/// Policies: no mime sniffing, xss filtering, no ref
async fn launch_web() {
    // launch web server
    let shield = rocket::shield::Shield::default()
        .enable(rocket::shield::Referrer::NoReferrer)
        .enable(rocket::shield::XssFilter::EnableBlock)
        .enable(rocket::shield::NoSniff::Enable);
    let rocket = rocket::build()
        .attach(shield)
        .attach(database::Db::init())
        //.attach(rocket_dyn_templates::Template::fairing()) // If we ever need SSR, uncomment this
        .mount(
            "/",
            routes![
                crate::handlers::home,
                crate::handlers::workout_view,
                crate::handlers::static_file,
                crate::handlers::workout_new,
            ],
        )
        .mount(
            "/api",
            routes![crate::api::workout_json, crate::api::workout_post_json],
        )
        .register("/", catchers![crate::handlers::general_404]);
    let rocket = rocket.launch().await;

    match rocket {
        Ok(_) => {
            info!("Rocket web server started");
        }
        Err(e) => {
            error!("Rocket server failed to start: {}", e);
        }
    }
}
