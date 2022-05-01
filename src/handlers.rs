use crate::database::WorkoutID;

#[get("/workout/<id>")]
pub fn hello(id: String) -> String {
    format!("Hello, year old named {}!", id)
}
