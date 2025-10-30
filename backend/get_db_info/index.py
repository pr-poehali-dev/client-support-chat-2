import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API для получения информации о структуре базы данных
    Args: event - dict с httpMethod, queryStringParameters
          context - объект с атрибутами request_id, function_name
    Returns: HTTP response dict с информацией о таблицах и constraints
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': headers,
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'DATABASE_URL not configured'})
        }
    
    conn = None
    try:
        conn = psycopg2.connect(database_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            table_name = event.get('queryStringParameters', {}).get('table')
            schema_name = event.get('queryStringParameters', {}).get('schema', 'public')
            
            if not table_name:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'table parameter is required'})
                }
            
            # Get column information
            cur.execute('''
                SELECT 
                    column_name,
                    data_type,
                    character_maximum_length,
                    is_nullable,
                    column_default
                FROM information_schema.columns
                WHERE table_schema = %s AND table_name = %s
                ORDER BY ordinal_position
            ''', (schema_name, table_name))
            
            columns = cur.fetchall()
            
            # Get primary key constraints
            cur.execute('''
                SELECT 
                    tc.constraint_name,
                    tc.constraint_type,
                    kcu.column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu 
                    ON tc.constraint_name = kcu.constraint_name 
                    AND tc.table_schema = kcu.table_schema
                WHERE tc.table_schema = %s 
                    AND tc.table_name = %s 
                    AND tc.constraint_type = 'PRIMARY KEY'
            ''', (schema_name, table_name))
            
            primary_keys = cur.fetchall()
            
            # Get foreign key constraints
            cur.execute('''
                SELECT 
                    tc.constraint_name,
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                    ON ccu.constraint_name = tc.constraint_name
                    AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY' 
                    AND tc.table_schema = %s
                    AND tc.table_name = %s
            ''', (schema_name, table_name))
            
            foreign_keys = cur.fetchall()
            
            # Get unique constraints
            cur.execute('''
                SELECT 
                    tc.constraint_name,
                    kcu.column_name
                FROM information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                WHERE tc.constraint_type = 'UNIQUE' 
                    AND tc.table_schema = %s
                    AND tc.table_name = %s
            ''', (schema_name, table_name))
            
            unique_constraints = cur.fetchall()
            
            # Get check constraints
            cur.execute('''
                SELECT 
                    tc.constraint_name,
                    cc.check_clause
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.check_constraints AS cc
                    ON tc.constraint_name = cc.constraint_name
                    AND tc.constraint_schema = cc.constraint_schema
                WHERE tc.table_schema = %s
                    AND tc.table_name = %s
                    AND tc.constraint_type = 'CHECK'
            ''', (schema_name, table_name))
            
            check_constraints = cur.fetchall()
            
            # Get indexes
            cur.execute('''
                SELECT 
                    i.relname AS index_name,
                    a.attname AS column_name,
                    ix.indisunique AS is_unique,
                    ix.indisprimary AS is_primary
                FROM pg_class t
                JOIN pg_index ix ON t.oid = ix.indrelid
                JOIN pg_class i ON i.oid = ix.indexrelid
                JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
                JOIN pg_namespace n ON n.oid = t.relnamespace
                WHERE t.relkind = 'r'
                    AND n.nspname = %s
                    AND t.relname = %s
                ORDER BY i.relname, a.attnum
            ''', (schema_name, table_name))
            
            indexes = cur.fetchall()
            
            result = {
                'table_name': table_name,
                'schema_name': schema_name,
                'columns': [dict(col) for col in columns],
                'primary_keys': [dict(pk) for pk in primary_keys],
                'foreign_keys': [dict(fk) for fk in foreign_keys],
                'unique_constraints': [dict(uc) for uc in unique_constraints],
                'check_constraints': [dict(cc) for cc in check_constraints],
                'indexes': [dict(idx) for idx in indexes]
            }
            
            return {
                'statusCode': 200,
                'headers': headers,
                'isBase64Encoded': False,
                'body': json.dumps(result, indent=2)
            }
        
        return {
            'statusCode': 405,
            'headers': headers,
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'isBase64Encoded': False,
            'body': json.dumps({'error': str(e)})
        }
    finally:
        if conn:
            conn.close()
