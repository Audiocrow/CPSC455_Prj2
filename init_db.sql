CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name    TEXT    NOT NULL,
    last_name   TEXT    NOT NULL,
    address   TEXT    NOT NULL,
    pwd_hash     TEXT    NOT NULL,
    UNIQUE (first_name, last_name)
);
CREATE INDEX user_name_idx ON users (first_name, last_name);
CREATE TABLE accounts (
    acc_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    balance REAL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
CREATE INDEX acc_user_idx ON accounts (user_id);
