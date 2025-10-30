-- Добавление ролей для существующих сотрудников на основе их основной роли
INSERT INTO employee_roles (employee_id, role)
SELECT id, role FROM employees
WHERE NOT EXISTS (
    SELECT 1 FROM employee_roles WHERE employee_id = employees.id
);