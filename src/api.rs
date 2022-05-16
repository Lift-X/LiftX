use rocket_db_pools::Connection;

use crate::database::Db;

#[get("/workouts/<id>/json")]
pub async fn workout_json(
    id: String,
    mut db: Connection<Db>,
) -> Result<serde_json::Value, serde_json::Value> {
    // Query the database via ID, return data column
    let wrap_data = sqlx::query!("SELECT * FROM workout WHERE id = ?", id).fetch_one(&mut *db);

    // If workout doesn't exist, 404.
    match wrap_data.await {
        Ok(wrap_data) => {
            return Ok(serde_json::from_str(wrap_data.data.unwrap().as_str()).unwrap());
        }
        Err(_) => {
            return Err(serde_json::from_str("{\"error\": \"Workout not found!\"}").unwrap());
        }
    }
    // If workout exists in database, return it
    // Fun fact: I spent multiple hours trying to remove the "std::option::Option<String>" from the String. (reading docs is really helpful, kids.)
}