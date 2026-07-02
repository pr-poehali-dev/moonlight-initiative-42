"""Чат для игроков сервера — отправка и получение сообщений, статусы онлайн"""
import json
import os
import psycopg2
from datetime import datetime, timedelta

SCHEMA = "t_p1151301_moonlight_initiative"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def esc(s):
    return s.replace("'", "''")

def handler(event: dict, context) -> dict:
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    method = event.get("httpMethod", "GET")

    if method == "GET":
        action = (event.get("queryStringParameters") or {}).get("action", "messages")
        conn = get_conn()
        cur = conn.cursor()

        if action == "online":
            cutoff = (datetime.utcnow() - timedelta(minutes=5)).strftime("%Y-%m-%d %H:%M:%S")
            cur.execute(f"SELECT nickname FROM {SCHEMA}.chat_users WHERE last_seen > '{cutoff}' ORDER BY nickname")
            users = [row[0] for row in cur.fetchall()]
            conn.close()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"online": users})}

        cur.execute(f"SELECT id, nickname, message, image_url, created_at FROM {SCHEMA}.chat_messages ORDER BY created_at DESC LIMIT 50")
        rows = cur.fetchall()
        conn.close()
        messages = [
            {"id": r[0], "nickname": r[1], "message": r[2], "image_url": r[3],
             "created_at": r[4].isoformat() if r[4] else None}
            for r in rows
        ]
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"messages": list(reversed(messages))})}

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        nickname = esc((body.get("nickname") or "").strip()[:50])
        message = esc((body.get("message") or "").strip()[:1000])

        if not nickname or not message:
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Укажи никнейм и сообщение"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"INSERT INTO {SCHEMA}.chat_users (nickname, last_seen) VALUES ('{nickname}', NOW()) ON CONFLICT (nickname) DO UPDATE SET last_seen = NOW()")
        cur.execute(f"INSERT INTO {SCHEMA}.chat_messages (nickname, message) VALUES ('{nickname}', '{message}') RETURNING id, created_at")
        row = cur.fetchone()
        conn.commit()
        conn.close()

        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({"id": row[0], "created_at": row[1].isoformat()})
        }

    return {"statusCode": 405, "headers": headers, "body": json.dumps({"error": "Method not allowed"})}