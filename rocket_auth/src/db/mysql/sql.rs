pub(crate) const CREATE_TABLE: &str = "
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR (254) UNIQUE NOT NULL,
	password VARCHAR ( 255 ) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE
);
";

pub(crate) const INSERT_USER: &str = "
INSERT INTO users (name, password, is_admin) VALUES (?, ?, ?);
";

pub(crate) const UPDATE_USER: &str = "
UPDATE table SET
    name = ?,
    password = ?,
    is_admin = ?,
WHERE
    id = ?
";

pub(crate) const SELECT_BY_ID: &str = "
SELECT * FROM users WHERE id = ?;
";

pub(crate) const SELECT_BY_NAME: &str = "
SELECT * FROM users WHERE name = ?;
";

pub(crate) const REMOVE_BY_ID: &str = "
DELETE FROM users WHERE id = ?;
";
pub(crate) const REMOVE_BY_NAME: &str = "
DELETE FROM users WHERE name = ?;
";
