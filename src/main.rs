#![forbid(unsafe_code)]
// Use all clippy lints (just to get an idea)
#![warn(clippy::all, clippy::pedantic)]
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
pub mod error;
//pub mod util;

use rocket_db_pools::Database;

#[allow(unused_imports)]
use crate::{database::create_connection, equipment::Weight};

#[rocket::main]
async fn main() {
    // connect to DB
    let conn = sqlx::SqlitePool::connect("data.db").await;

    match conn {
        Ok(conn) => {
            // Initialize Database tables if they don't exist
            database::build_tables(conn.clone()).await;
            let users: rocket_auth::Users = conn.clone().into();
            info!("Database connection successful");
            launch_web(conn, users).await;
        }
        Err(e) => {
            error!("Database connection failed: {}", e);
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
    let rocket = rocket::build()
        .attach(shield)
        .attach(database::Db::init())
        //.attach(rocket_dyn_templates::Template::fairing()) // If we ever need SSR again, uncomment this
        .mount(
            "/",
            routes![
                crate::handlers::frontpage,
                crate::handlers::workout_view,
                crate::handlers::static_file,
                crate::handlers::workout_new,
                crate::handlers::register,
                crate::handlers::login,
                crate::handlers::logout,
                crate::handlers::home,
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
                crate::api::get_user_workouts_recent
            ],
        )
        .register("/", catchers![crate::handlers::general_404])
        .manage(conn)
        .manage(users);
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
