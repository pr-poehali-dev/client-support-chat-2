-- Добавляем поля для таймера и распределения
ALTER TABLE chats ADD COLUMN assigned_at TIMESTAMP;
ALTER TABLE chats ADD COLUMN deadline TIMESTAMP;
ALTER TABLE chats ADD COLUMN extension_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE chats ADD COLUMN extension_deadline TIMESTAMP;

-- Таблица для базы знаний
CREATE TABLE knowledge_base (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    category VARCHAR(100),
    content TEXT,
    views INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    author VARCHAR(255)
);

-- Таблица для отслеживания статусов операторов
CREATE TABLE operator_status (
    id SERIAL PRIMARY KEY,
    operator_name VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'offline',
    active_chats_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX idx_chats_assigned_operator ON chats(assigned_operator);
CREATE INDEX idx_chats_deadline ON chats(deadline);
CREATE INDEX idx_operator_status_name ON operator_status(operator_name);