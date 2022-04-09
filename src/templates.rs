use axum::{
    response::HTML,
};
use askama::Template;

#[derive(Template)]
#[template(path = "workout/view.html")]
struct WorkoutViewTemplate<'a> {
    workout: &'a WorkoutEntry,
}

impl WorkoutViewTemplate<'_> {
    pub fn render(&self) -> HTML {
        self.render_response()
    }
}