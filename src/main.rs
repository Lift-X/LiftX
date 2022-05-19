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

#[allow(unused_imports)]
use crate::{database::create_connection, equipment::Weight};

#[rocket::main]
async fn main() {
    // connect to DB
    let conn = sqlx::SqlitePool::connect("data.db").await;

    match conn {
        Ok(conn) => {
            // Initialize database tables, if not already present
            let users: rocket_auth::Users = conn.clone().into();
            users.create_table().await.unwrap();

            database::build_tables(conn.clone()).await;
            info!("Database connection successful");
            launch_web(conn).await;
        }
        Err(e) => {
            error!("Database connection failed: {}", e);
        }
    }
}

/// Launch the rocket web server.
/// Policies: no mime sniffing, xss filtering, no ref
async fn launch_web(conn: sqlx::SqlitePool) {
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
        .register("/", catchers![crate::handlers::general_404]).manage(conn);
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
