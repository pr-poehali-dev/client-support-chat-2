-- Таблица оценок качества
CREATE TABLE ratings (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id),
    operator_name VARCHAR(100) NOT NULL,
    rated_by VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ratings_operator ON ratings(operator_name);
CREATE INDEX idx_ratings_chat ON ratings(chat_id);
