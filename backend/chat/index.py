import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API для управления чатами, сотрудниками и графиком смен
    Args: event - dict с httpMethod, body, queryStringParameters
          context - объект с атрибутами request_id, function_name
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
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
    
    conn = psycopg2.connect(database_url)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'GET':
            action = event.get('queryStringParameters', {}).get('action', 'list')
            
            if action == 'list':
                operator_name = event.get('queryStringParameters', {}).get('operatorName', '')
                
                if operator_name:
                    cur.execute('''
                        SELECT c.id, c.status, c.assigned_operator, c.created_at, c.updated_at,
                               c.assigned_at, c.deadline, c.extension_requested, c.extension_deadline,
                               cl.name as client_name, cl.email, cl.phone, cl.ip_address
                        FROM chats c
                        LEFT JOIN clients cl ON c.client_id = cl.id
                        WHERE c.assigned_operator = %s OR c.status = 'waiting'
                        ORDER BY c.updated_at DESC
                    ''', (operator_name,))
                else:
                    cur.execute('''
                        SELECT c.id, c.status, c.assigned_operator, c.created_at, c.updated_at,
                               c.assigned_at, c.deadline, c.extension_requested, c.extension_deadline,
                               cl.name as client_name, cl.email, cl.phone, cl.ip_address
                        FROM chats c
                        LEFT JOIN clients cl ON c.client_id = cl.id
                        ORDER BY c.updated_at DESC
                    ''')
                
                chats = cur.fetchall()
                
                result = []
                for chat in chats:
                    result.append({
                        'id': chat['id'],
                        'status': chat['status'],
                        'assignedOperator': chat['assigned_operator'],
                        'clientName': chat['client_name'] or 'Клиент',
                        'email': chat['email'] or '',
                        'phone': chat['phone'] or '',
                        'ipAddress': chat['ip_address'] or '',
                        'createdAt': chat['created_at'].isoformat() if chat['created_at'] else None,
                        'updatedAt': chat['updated_at'].isoformat() if chat['updated_at'] else None,
                        'assignedAt': chat['assigned_at'].isoformat() if chat['assigned_at'] else None,
                        'deadline': chat['deadline'].isoformat() if chat['deadline'] else None,
                        'extensionRequested': chat['extension_requested'] or False,
                        'extensionDeadline': chat['extension_deadline'].isoformat() if chat['extension_deadline'] else None
                    })
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'chats': result})
                }
            
            elif action == 'messages':
                chat_id = event.get('queryStringParameters', {}).get('chatId', '')
                if not chat_id:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'chatId required'})
                    }
                
                cur.execute('''
                    SELECT id, sender_type, sender_name, message_text, created_at
                    FROM messages
                    WHERE chat_id = %s
                    ORDER BY created_at ASC
                ''', (int(chat_id),))
                messages = cur.fetchall()
                
                result = []
                for msg in messages:
                    result.append({
                        'id': msg['id'],
                        'senderType': msg['sender_type'],
                        'senderName': msg['sender_name'] or '',
                        'text': msg['message_text'],
                        'createdAt': msg['created_at'].isoformat() if msg['created_at'] else None
                    })
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'messages': result})
                }
            
            elif action == 'employees':
                cur.execute('''
                    SELECT id, username, name, role, status, created_at, updated_at
                    FROM employees
                    ORDER BY name ASC
                ''')
                employees = cur.fetchall()
                
                result = []
                for emp in employees:
                    result.append({
                        'id': emp['id'],
                        'username': emp['username'],
                        'name': emp['name'],
                        'role': emp['role'],
                        'status': emp['status'] or 'offline',
                        'createdAt': emp['created_at'].isoformat() if emp['created_at'] else None,
                        'updatedAt': emp['updated_at'].isoformat() if emp['updated_at'] else None
                    })
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'employees': result})
                }
            
            elif action == 'shifts':
                cur.execute('''
                    SELECT id, employee_name, shift_date, start_time, end_time, shift_type, created_at
                    FROM shifts
                    ORDER BY shift_date DESC, start_time ASC
                ''')
                shifts = cur.fetchall()
                
                result = []
                for shift in shifts:
                    result.append({
                        'id': shift['id'],
                        'employeeName': shift['employee_name'],
                        'shiftDate': shift['shift_date'].isoformat() if shift['shift_date'] else None,
                        'startTime': str(shift['start_time']) if shift['start_time'] else None,
                        'endTime': str(shift['end_time']) if shift['end_time'] else None,
                        'shiftType': shift['shift_type'],
                        'createdAt': shift['created_at'].isoformat() if shift['created_at'] else None
                    })
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'shifts': result})
                }
            
            elif action == 'clients':
                cur.execute('''
                    SELECT id, ip_address, name, email, phone, created_at, last_seen
                    FROM clients
                    ORDER BY last_seen DESC
                ''')
                clients = cur.fetchall()
                
                result = []
                for client in clients:
                    result.append({
                        'id': client['id'],
                        'ipAddress': client['ip_address'],
                        'name': client['name'] or 'Не указано',
                        'email': client['email'] or '',
                        'phone': client['phone'] or '',
                        'createdAt': client['created_at'].isoformat() if client['created_at'] else None,
                        'lastSeen': client['last_seen'].isoformat() if client['last_seen'] else None
                    })
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'clients': result})
                }
            
            elif action == 'knowledge':
                cur.execute('''
                    SELECT id, title, category, content, views, created_at, updated_at, author
                    FROM knowledge_articles
                    ORDER BY created_at DESC
                ''')
                articles = cur.fetchall()
                
                result = []
                for article in articles:
                    result.append({
                        'id': article['id'],
                        'title': article['title'],
                        'category': article['category'],
                        'content': article['content'],
                        'views': article['views'] or 0,
                        'createdAt': article['created_at'].isoformat() if article['created_at'] else None,
                        'updatedAt': article['updated_at'].isoformat() if article['updated_at'] else None,
                        'author': article['author'] or ''
                    })
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'articles': result})
                }
            
            elif action == 'closedChats':
                cur.execute('''
                    SELECT c.id, c.status, c.assigned_operator, c.created_at, c.updated_at,
                           cl.name as client_name, cl.email, cl.phone, cl.ip_address,
                           r.id as rating_id, r.score as rating_score
                    FROM chats c
                    LEFT JOIN clients cl ON c.client_id = cl.id
                    LEFT JOIN ratings r ON c.id = r.chat_id
                    WHERE c.status = 'closed'
                    ORDER BY c.updated_at DESC
                ''')
                chats = cur.fetchall()
                
                result = []
                for chat in chats:
                    result.append({
                        'id': chat['id'],
                        'status': chat['status'],
                        'assignedOperator': chat['assigned_operator'],
                        'clientName': chat['client_name'] or 'Клиент',
                        'email': chat['email'] or '',
                        'phone': chat['phone'] or '',
                        'ipAddress': chat['ip_address'] or '',
                        'createdAt': chat['created_at'].isoformat() if chat['created_at'] else None,
                        'updatedAt': chat['updated_at'].isoformat() if chat['updated_at'] else None,
                        'hasRating': chat['rating_id'] is not None,
                        'ratingScore': chat['rating_score']
                    })
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'chats': result})
                }
            
            elif action == 'ratings':
                operator_name = event.get('queryStringParameters', {}).get('operatorName', '')
                
                if not operator_name:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'operatorName required'})
                    }
                
                cur.execute('''
                    SELECT id, chat_id, operator_name, rated_by, score, comment, created_at
                    FROM ratings
                    WHERE operator_name = %s
                    ORDER BY created_at DESC
                ''', (operator_name,))
                ratings = cur.fetchall()
                
                result = []
                for rating in ratings:
                    result.append({
                        'id': rating['id'],
                        'chatId': rating['chat_id'],
                        'operatorName': rating['operator_name'],
                        'ratedBy': rating['rated_by'],
                        'score': rating['score'],
                        'comment': rating['comment'] or '',
                        'createdAt': rating['created_at'].isoformat() if rating['created_at'] else None
                    })
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'ratings': result})
                }
            
            elif action == 'corporateChats':
                employee_name = event.get('queryStringParameters', {}).get('employeeName', '')
                
                if not employee_name:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'employeeName required'})
                    }
                
                cur.execute('''
                    SELECT id, title, created_by, created_at, updated_at
                    FROM corporate_chats
                    WHERE created_by = %s OR id IN (
                        SELECT DISTINCT chat_id FROM corporate_messages WHERE sender_name = %s
                    )
                    ORDER BY updated_at DESC
                ''', (employee_name, employee_name))
                chats = cur.fetchall()
                
                result = []
                for chat in chats:
                    result.append({
                        'id': chat['id'],
                        'title': chat['title'],
                        'createdBy': chat['created_by'],
                        'createdAt': chat['created_at'].isoformat() if chat['created_at'] else None,
                        'updatedAt': chat['updated_at'].isoformat() if chat['updated_at'] else None
                    })
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'chats': result})
                }
            
            elif action == 'corporateMessages':
                chat_id = event.get('queryStringParameters', {}).get('chatId', '')
                
                if not chat_id:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'chatId required'})
                    }
                
                cur.execute('''
                    SELECT id, sender_name, message_text, created_at
                    FROM corporate_messages
                    WHERE chat_id = %s
                    ORDER BY created_at ASC
                ''', (int(chat_id),))
                messages = cur.fetchall()
                
                result = []
                for msg in messages:
                    result.append({
                        'id': msg['id'],
                        'senderName': msg['sender_name'],
                        'text': msg['message_text'],
                        'createdAt': msg['created_at'].isoformat() if msg['created_at'] else None
                    })
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'messages': result})
                }
            
            elif action == 'news':
                cur.execute('''
                    SELECT id, title, content, author, created_at, published_at
                    FROM news
                    ORDER BY published_at DESC, created_at DESC
                ''')
                news_items = cur.fetchall()
                
                result = []
                for item in news_items:
                    result.append({
                        'id': item['id'],
                        'title': item['title'],
                        'content': item['content'],
                        'author': item['author'],
                        'createdAt': item['created_at'].isoformat() if item['created_at'] else None,
                        'publishedAt': item['published_at'].isoformat() if item['published_at'] else None
                    })
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'news': result})
                }
            
            elif action == 'allChats':
                cur.execute('''
                    SELECT c.id, c.status, c.assigned_operator, c.created_at, c.updated_at,
                           c.assigned_at, c.deadline, c.extension_requested, c.extension_deadline,
                           cl.name as client_name, cl.email, cl.phone, cl.ip_address,
                           cr.score as client_rating_score, cr.comment as client_rating_comment
                    FROM chats c
                    LEFT JOIN clients cl ON c.client_id = cl.id
                    LEFT JOIN client_ratings cr ON c.id = cr.chat_id
                    ORDER BY c.updated_at DESC
                ''')
                chats = cur.fetchall()
                
                result = []
                for chat in chats:
                    result.append({
                        'id': chat['id'],
                        'status': chat['status'],
                        'assignedOperator': chat['assigned_operator'],
                        'clientName': chat['client_name'] or 'Клиент',
                        'email': chat['email'] or '',
                        'phone': chat['phone'] or '',
                        'ipAddress': chat['ip_address'] or '',
                        'createdAt': chat['created_at'].isoformat() if chat['created_at'] else None,
                        'updatedAt': chat['updated_at'].isoformat() if chat['updated_at'] else None,
                        'assignedAt': chat['assigned_at'].isoformat() if chat['assigned_at'] else None,
                        'deadline': chat['deadline'].isoformat() if chat['deadline'] else None,
                        'extensionRequested': chat['extension_requested'] or False,
                        'extensionDeadline': chat['extension_deadline'].isoformat() if chat['extension_deadline'] else None,
                        'clientRatingScore': chat['client_rating_score'],
                        'clientRatingComment': chat['client_rating_comment'] or ''
                    })
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'chats': result})
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action', '')
            
            if action == 'startChat':
                ip_address = body_data.get('ipAddress', '')
                client_name = body_data.get('name')
                email = body_data.get('email')
                phone = body_data.get('phone')
                
                if not ip_address:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'ipAddress required'})
                    }
                
                cur.execute('''
                    SELECT id FROM clients WHERE ip_address = %s
                ''', (ip_address,))
                existing_client = cur.fetchone()
                
                if existing_client:
                    client_id = existing_client['id']
                    cur.execute('''
                        UPDATE clients 
                        SET name = %s, email = %s, phone = %s, last_seen = CURRENT_TIMESTAMP
                        WHERE id = %s
                    ''', (client_name, email, phone, client_id))
                else:
                    cur.execute('''
                        INSERT INTO clients (ip_address, name, email, phone, last_seen)
                        VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
                        RETURNING id
                    ''', (ip_address, client_name, email, phone))
                    client_id = cur.fetchone()['id']
                
                cur.execute('''
                    SELECT id FROM chats 
                    WHERE client_id = %s AND status IN ('waiting', 'active')
                    ORDER BY created_at DESC LIMIT 1
                ''', (client_id,))
                existing_chat = cur.fetchone()
                
                if existing_chat:
                    chat_id = existing_chat['id']
                else:
                    cur.execute('''
                        INSERT INTO chats (client_id, status)
                        VALUES (%s, 'waiting')
                        RETURNING id
                    ''', (client_id,))
                    chat_id = cur.fetchone()['id']
                    
                    assign_chat_to_operator(cur, conn)
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'chatId': chat_id, 'clientId': client_id})
                }
            
            elif action == 'sendMessage':
                chat_id = body_data.get('chatId')
                sender_type = body_data.get('senderType', '')
                sender_name = body_data.get('senderName')
                message_text = body_data.get('message', '')
                
                if not chat_id or not message_text:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'chatId and message required'})
                    }
                
                cur.execute('''
                    INSERT INTO messages (chat_id, sender_type, sender_name, message_text)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, created_at
                ''', (chat_id, sender_type, sender_name, message_text))
                result = cur.fetchone()
                
                cur.execute('''
                    UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = %s
                ''', (chat_id,))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'messageId': result['id'],
                        'createdAt': result['created_at'].isoformat()
                    })
                }
            
            elif action == 'updateOperatorStatus':
                operator_name = body_data.get('operatorName', '')
                status = body_data.get('status', '')
                
                if not operator_name or not status:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'operatorName and status required'})
                    }
                
                cur.execute('''
                    UPDATE employees 
                    SET status = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE name = %s
                ''', (status, operator_name))
                
                if status not in ['online']:
                    cur.execute('''
                        SELECT id FROM chats 
                        WHERE assigned_operator = %s AND status = 'active'
                    ''', (operator_name,))
                    active_chats = cur.fetchall()
                    
                    for chat in active_chats:
                        cur.execute('''
                            UPDATE chats 
                            SET assigned_operator = NULL, status = 'waiting', deadline = NULL
                            WHERE id = %s
                        ''', (chat['id'],))
                    
                    assign_chat_to_operator(cur, conn)
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'createShift':
                employee_name = body_data.get('employeeName', '')
                shift_date = body_data.get('shiftDate', '')
                start_time = body_data.get('startTime', '')
                end_time = body_data.get('endTime', '')
                shift_type = body_data.get('shiftType', 'day')
                
                if not all([employee_name, shift_date, start_time, end_time]):
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'All fields required'})
                    }
                
                cur.execute('''
                    INSERT INTO shifts (employee_name, shift_date, start_time, end_time, shift_type)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                ''', (employee_name, shift_date, start_time, end_time, shift_type))
                shift_id = cur.fetchone()['id']
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'shiftId': shift_id})
                }
            
            elif action == 'createKnowledge':
                title = body_data.get('title', '')
                category = body_data.get('category', '')
                content = body_data.get('content', '')
                author = body_data.get('author', '')
                
                if not all([title, category, content]):
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'title, category, content required'})
                    }
                
                cur.execute('''
                    INSERT INTO knowledge_articles (title, category, content, author, views)
                    VALUES (%s, %s, %s, %s, 0)
                    RETURNING id
                ''', (title, category, content, author))
                article_id = cur.fetchone()['id']
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'articleId': article_id})
                }
            
            elif action == 'createRating':
                chat_id = body_data.get('chatId')
                operator_name = body_data.get('operatorName', '')
                rated_by = body_data.get('ratedBy', '')
                score = body_data.get('score')
                comment = body_data.get('comment', '')
                
                if not all([chat_id, operator_name, rated_by, score is not None]):
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'chatId, operatorName, ratedBy, score required'})
                    }
                
                if score < 1 or score > 5:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'score must be between 1 and 5'})
                    }
                
                cur.execute('''
                    SELECT id FROM ratings WHERE chat_id = %s
                ''', (chat_id,))
                existing_rating = cur.fetchone()
                
                if existing_rating:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'Chat already rated by QC'})
                    }
                
                cur.execute('''
                    INSERT INTO ratings (chat_id, operator_name, rated_by, score, comment)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                ''', (chat_id, operator_name, rated_by, score, comment))
                rating_id = cur.fetchone()['id']
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'ratingId': rating_id})
                }
            
            elif action == 'createEmployee':
                username = body_data.get('username', '')
                name = body_data.get('name', '')
                role = body_data.get('role', 'operator')
                password = body_data.get('password', '')
                
                if not all([username, name, password]):
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'username, name, password required'})
                    }
                
                cur.execute('''
                    SELECT id FROM employees WHERE username = %s
                ''', (username,))
                existing_employee = cur.fetchone()
                
                if existing_employee:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'Username already exists'})
                    }
                
                cur.execute('''
                    INSERT INTO employees (username, name, role, password, status)
                    VALUES (%s, %s, %s, %s, 'offline')
                    RETURNING id
                ''', (username, name, role, password))
                employee_id = cur.fetchone()['id']
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'employeeId': employee_id})
                }
            
            elif action == 'submitClientRating':
                chat_id = body_data.get('chatId')
                score = body_data.get('score')
                comment = body_data.get('comment', '')
                
                if not all([chat_id, score is not None]):
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'chatId and score required'})
                    }
                
                if score < 1 or score > 5:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'score must be between 1 and 5'})
                    }
                
                cur.execute('''
                    SELECT id FROM client_ratings WHERE chat_id = %s
                ''', (chat_id,))
                existing_rating = cur.fetchone()
                
                if existing_rating:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'Chat already rated by client'})
                    }
                
                cur.execute('''
                    INSERT INTO client_ratings (chat_id, score, comment)
                    VALUES (%s, %s, %s)
                    RETURNING id
                ''', (chat_id, score, comment))
                rating_id = cur.fetchone()['id']
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'ratingId': rating_id})
                }
            
            elif action == 'createCorporateChat':
                title = body_data.get('title', '')
                created_by = body_data.get('createdBy', '')
                
                if not all([title, created_by]):
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'title and createdBy required'})
                    }
                
                cur.execute('''
                    INSERT INTO corporate_chats (title, created_by)
                    VALUES (%s, %s)
                    RETURNING id
                ''', (title, created_by))
                chat_id = cur.fetchone()['id']
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'chatId': chat_id})
                }
            
            elif action == 'sendCorporateMessage':
                chat_id = body_data.get('chatId')
                sender_name = body_data.get('senderName', '')
                message_text = body_data.get('message', '')
                
                if not all([chat_id, sender_name, message_text]):
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'chatId, senderName, message required'})
                    }
                
                cur.execute('''
                    INSERT INTO corporate_messages (chat_id, sender_name, message_text)
                    VALUES (%s, %s, %s)
                    RETURNING id, created_at
                ''', (chat_id, sender_name, message_text))
                result = cur.fetchone()
                
                cur.execute('''
                    UPDATE corporate_chats SET updated_at = CURRENT_TIMESTAMP WHERE id = %s
                ''', (chat_id,))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({
                        'messageId': result['id'],
                        'createdAt': result['created_at'].isoformat()
                    })
                }
            
            elif action == 'createNews':
                title = body_data.get('title', '')
                content = body_data.get('content', '')
                author = body_data.get('author', '')
                
                if not all([title, content, author]):
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'title, content, author required'})
                    }
                
                cur.execute('''
                    INSERT INTO news (title, content, author, published_at)
                    VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
                    RETURNING id
                ''', (title, content, author))
                news_id = cur.fetchone()['id']
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'newsId': news_id})
                }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action', '')
            
            if action == 'updateStatus':
                chat_id = body_data.get('chatId')
                status = body_data.get('status', '')
                assigned_operator = body_data.get('assignedOperator', '')
                
                if not chat_id or not status:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'chatId and status required'})
                    }
                
                if status == 'active':
                    cur.execute('''
                        SELECT COUNT(*) as count FROM chats 
                        WHERE assigned_operator = %s AND status = 'active'
                    ''', (assigned_operator,))
                    active_count = cur.fetchone()['count']
                    
                    if active_count >= 2:
                        return {
                            'statusCode': 400,
                            'headers': headers,
                            'isBase64Encoded': False,
                            'body': json.dumps({'error': 'Maximum 2 active chats per operator'})
                        }
                    
                    deadline = datetime.utcnow() + timedelta(minutes=15)
                    cur.execute('''
                        UPDATE chats 
                        SET status = %s, assigned_operator = %s, assigned_at = CURRENT_TIMESTAMP, 
                            deadline = %s, updated_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                    ''', (status, assigned_operator, deadline, chat_id))
                else:
                    cur.execute('''
                        UPDATE chats 
                        SET status = %s, updated_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                    ''', (status, chat_id))
                
                conn.commit()
                
                if status in ['closed', 'postponed', 'escalated']:
                    assign_chat_to_operator(cur, conn)
                    conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'extendChat':
                chat_id = body_data.get('chatId')
                
                if not chat_id:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'chatId required'})
                    }
                
                new_deadline = datetime.utcnow() + timedelta(minutes=15)
                cur.execute('''
                    UPDATE chats 
                    SET deadline = %s, extension_requested = FALSE, extension_deadline = NULL,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                ''', (new_deadline, chat_id))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'updateShift':
                shift_id = body_data.get('shiftId')
                employee_name = body_data.get('employeeName', '')
                shift_date = body_data.get('shiftDate', '')
                start_time = body_data.get('startTime', '')
                end_time = body_data.get('endTime', '')
                shift_type = body_data.get('shiftType', 'day')
                
                if not shift_id:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'shiftId required'})
                    }
                
                cur.execute('''
                    UPDATE shifts 
                    SET employee_name = %s, shift_date = %s, start_time = %s, 
                        end_time = %s, shift_type = %s
                    WHERE id = %s
                ''', (employee_name, shift_date, start_time, end_time, shift_type, shift_id))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'updateKnowledge':
                article_id = body_data.get('articleId')
                title = body_data.get('title', '')
                category = body_data.get('category', '')
                content = body_data.get('content', '')
                
                if not article_id:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'articleId required'})
                    }
                
                cur.execute('''
                    UPDATE knowledge_articles 
                    SET title = %s, category = %s, content = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                ''', (title, category, content, article_id))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True})
                }
            
            elif action == 'updateEmployee':
                employee_id = body_data.get('employeeId')
                username = body_data.get('username')
                name = body_data.get('name')
                role = body_data.get('role')
                password = body_data.get('password')
                
                if not employee_id:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'employeeId required'})
                    }
                
                update_fields = []
                update_values = []
                
                if username:
                    update_fields.append('username = %s')
                    update_values.append(username)
                if name:
                    update_fields.append('name = %s')
                    update_values.append(name)
                if role:
                    update_fields.append('role = %s')
                    update_values.append(role)
                if password:
                    update_fields.append('password = %s')
                    update_values.append(password)
                
                if not update_fields:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'At least one field to update required'})
                    }
                
                update_fields.append('updated_at = CURRENT_TIMESTAMP')
                update_values.append(employee_id)
                
                query = f'''
                    UPDATE employees 
                    SET {', '.join(update_fields)}
                    WHERE id = %s
                '''
                
                cur.execute(query, update_values)
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True})
                }
        
        return {
            'statusCode': 404,
            'headers': headers,
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Action not found'})
        }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': headers,
            'isBase64Encoded': False,
            'body': json.dumps({'error': str(e)})
        }
    
    finally:
        cur.close()
        conn.close()


def assign_chat_to_operator(cur, conn):
    '''
    Автоматическое назначение ожидающих чатов операторам онлайн
    Максимум 2 активных чата на оператора
    '''
    cur.execute('''
        SELECT name FROM employees 
        WHERE status = 'online'
        ORDER BY name ASC
    ''')
    online_operators = cur.fetchall()
    
    if not online_operators:
        return
    
    for operator in online_operators:
        operator_name = operator['name']
        
        cur.execute('''
            SELECT COUNT(*) as count FROM chats 
            WHERE assigned_operator = %s AND status = 'active'
        ''', (operator_name,))
        active_count = cur.fetchone()['count']
        
        if active_count < 2:
            cur.execute('''
                SELECT id FROM chats 
                WHERE status = 'waiting' 
                ORDER BY created_at ASC 
                LIMIT 1
            ''')
            waiting_chat = cur.fetchone()
            
            if waiting_chat:
                deadline = datetime.utcnow() + timedelta(minutes=15)
                cur.execute('''
                    UPDATE chats 
                    SET status = 'active', assigned_operator = %s, 
                        assigned_at = CURRENT_TIMESTAMP, deadline = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                ''', (operator_name, deadline, waiting_chat['id']))
                conn.commit()
                return
