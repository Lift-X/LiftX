#[macro_use]
extern crate rocket;

pub mod database;
pub mod equipment;
mod exercises;
pub mod handlers;
pub mod muscles;

use std::alloc::Layout;

use equipment::WeightType;
use rocket::{Rocket, Build};
use rocket_db_pools::Database;
use sqlx::ConnectOptions;

#[allow(unused_imports)]
use crate::{database::create_connection, equipment::Weight, handlers::hello};

use exercises::*;

// Global Preference for weight, implement configuration later
const GLOBAL_WEIGHT_UNIT: WeightType = equipment::POUNDS;

#[launch]
async fn rocket() -> _ {
    /*
    let bench_press = SetEntry {
        exercise: EXERCISE_BENCH_PRESS,
        reps: 8,
        weight: Weight {
            weight: 135.0,
            weight_unit: GLOBAL_WEIGHT_UNIT,
        },
        reps_in_reserve: 1.5,
    };
    let mut bench_set = ExerciseEntry {
        exercise: EXERCISE_BENCH_PRESS,
        comments: String::from(""),
        sets: vec![bench_press.clone()],
    };
    for i in 0..2 {
        bench_set.sets.push(bench_press.clone());
    }
    //println!("{}", exercises::exercise_to_string_summary(&bench_set));
    let stringed_bench = bench_set.to_string_readable();
    println!("{}", stringed_bench);
    println!("{}", &bench_set.to_string());
    */

    // connect to DB
    let conn =
        <sqlx::sqlite::SqliteConnectOptions as std::str::FromStr>::from_str("sqlite://data.db")
            .unwrap()
            .create_if_missing(true)
            .connect()
            .await
            .unwrap();

    //28fcad1c-0f5b-49d1-8d5c-2286f15ff99a
    //let uuid = uuid::Uuid::new_v4();

    let rocket = launch_web();
    rocket.await
}


async fn launch_web() -> Rocket<Build> {
        // launch web server
        let shield = rocket::shield::Shield::default()
        .enable(rocket::shield::Referrer::NoReferrer)
        .enable(rocket::shield::XssFilter::EnableBlock);
    let rocket = rocket::build()
        .attach(shield)
        .attach(database::Db::init())
        .mount("/", routes![hello]);
    rocket
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_rocket_and_handlers() {
        let shield = rocket::shield::Shield::default()
            .enable(rocket::shield::Referrer::NoReferrer)
            .enable(rocket::shield::XssFilter::EnableBlock);
        let rocket = rocket::build()
            .attach(shield)
            .attach(database::Db::init())
            .mount("/", routes![hello])
            .ignite();
        assert_eq!(rocket.await.is_ok(), true)
    }
}
