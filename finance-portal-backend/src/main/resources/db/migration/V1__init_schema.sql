CREATE TABLE users (
                       id UUID PRIMARY KEY,
                       username VARCHAR(50) NOT NULL UNIQUE,
                       email VARCHAR(100) NOT NULL UNIQUE,
                       created_at TIMESTAMP NOT NULL
);

CREATE TABLE accounts (
                          id UUID PRIMARY KEY,
                          user_id UUID NOT NULL,
                          account_name VARCHAR(255) NOT NULL,
                          balance DECIMAL(19, 2) NOT NULL,
                          currency VARCHAR(3) NOT NULL,
                          created_at TIMESTAMP NOT NULL,
                          CONSTRAINT fk_account_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE transactions (
                              id UUID PRIMARY KEY,
                              account_id UUID NOT NULL,
                              amount DECIMAL(19, 2) NOT NULL,
                              transaction_type VARCHAR(255) NOT NULL,
                              description VARCHAR(255),
                              transaction_date TIMESTAMP NOT NULL,
                              CONSTRAINT fk_transaction_account FOREIGN KEY (account_id) REFERENCES accounts (id)
);
