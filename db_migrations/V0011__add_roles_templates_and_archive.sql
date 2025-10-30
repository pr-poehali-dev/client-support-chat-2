-- Создание таблицы для ролей сотрудников (множественные роли)
CREATE TABLE IF NOT EXISTS employee_roles (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, role)
);

-- Создание таблицы шаблонов для Jira портала
CREATE TABLE IF NOT EXISTS jira_templates (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы архива оцененных QC тикетов
CREATE TABLE IF NOT EXISTS qc_archive (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL,
    operator_name VARCHAR(100),
    qc_name VARCHAR(100),
    rating_score INTEGER,
    rating_comment TEXT,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);