-- Назначаем существующий чат на online оператора
UPDATE chats 
SET 
    status = 'active',
    assigned_operator = 'Иван Петров',
    assigned_at = CURRENT_TIMESTAMP,
    deadline = CURRENT_TIMESTAMP + INTERVAL '15 minutes',
    updated_at = CURRENT_TIMESTAMP
WHERE status = 'waiting';
