-- Добавление таблицы для корпоративных чатов
CREATE TABLE IF NOT EXISTS corporate_chats (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS corporate_chat_members (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES corporate_chats(id),
    employee_name VARCHAR(255) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_admin BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS corporate_messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES corporate_chats(id),
    sender_name VARCHAR(255) NOT NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавление таблицы для новостей
CREATE TABLE IF NOT EXISTS news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавление поля для оценки от клиента в таблицу chats
ALTER TABLE chats ADD COLUMN IF NOT EXISTS client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5);
ALTER TABLE chats ADD COLUMN IF NOT EXISTS client_rating_comment TEXT;