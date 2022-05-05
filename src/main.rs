#[macro_use]
extern crate rocket;

pub mod database;
pub mod equipment;
mod exercises;
pub mod handlers;
pub mod muscles;
#[cfg(test)] mod tests;

use equipment::WeightType;
use rocket_db_pools::Database;
use sqlx::ConnectOptions;

#[allow(unused_imports)]
use crate::{database::create_connection, equipment::Weight, handlers::hello};

// Global Preference for weight, implement configuration later
const GLOBAL_WEIGHT_UNIT: WeightType = equipment::POUNDS;

#[tokio::main]
async fn main() {
    // connect to DB
    let conn =
        <sqlx::sqlite::SqliteConnectOptions as std::str::FromStr>::from_str("sqlite://data.db")
            .unwrap()
            .create_if_missing(true)
            .connect()
            .await
            .unwrap();

    let rocket = launch_web().await;
}


async fn launch_web() -> Result<(), rocket::Error> {
        // launch web server
        let shield = rocket::shield::Shield::default()
        .enable(rocket::shield::Referrer::NoReferrer)
        .enable(rocket::shield::XssFilter::EnableBlock);
    let rocket = rocket::build()
        .attach(shield)
        .attach(database::Db::init())
        .mount("/", routes![hello]);
    rocket.launch().await
}
