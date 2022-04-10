use std::collections::HashMap;

use axum::extract::{Extension, Form, Path, Query};
use maud::{html, Markup};

pub async fn view(Query(params): Query<HashMap<String, String>>) -> Markup {
    html! {
        h1 { "Hello, world!" }
    }
}
