use axum::{
    response::HTML,
};
use askama::Template;

#[derive(Template)]
#[template(path = "workout/view.html")]
struct WorkoutViewTemplate<'a> {
    //workout: &'a WorkoutEntry,
    workout: &'a ExerciseEntry,
}

impl WorkoutViewTemplate<'_> {
    pub fn render(&self) -> HTML {
        stringed_bench = exercises::exercise_to_string_summary(&workout);
        self.render_response()
    }
}