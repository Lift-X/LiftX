use serde::{Deserialize, Serialize};

#[allow(non_camel_case_types)]
#[derive(Debug, Serialize, Deserialize, thiserror::Error)]
pub enum WlrsError {
    #[error("You must be logged in to view this!")]
    WLRS_ERROR_NOT_LOGGED_IN,

    #[error("Not found!")]
    WLRS_ERROR_NOT_FOUND
}