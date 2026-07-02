"""Друзья — поиск по нику, добавление и список друзей"""
import json
import os
import psycopg2

SCHEMA = "t_p1151301_moonlight_initiative"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def esc(s):
    return s.replace("'", "''")

def handler(event: dict, context) -> dict:
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    }
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}

    if method == "GET":
        action = params.get("action", "list")
        conn = get_conn()
        cur = conn.cursor()

        if action == "search":
            q = esc(params.get("q", "").strip()[:50])
            if not q:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Укажи ник"})}
            cur.execute(f"SELECT nickname, last_seen FROM {SCHEMA}.chat_users WHERE LOWER(nickname) LIKE LOWER('%{q}%') LIMIT 20")
            rows = cur.fetchall()
            conn.close()
            users = [{"nickname": r[0], "last_seen": r[1].isoformat() if r[1] else None} for r in rows]
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"users": users})}

        # list friends
        nick = esc(params.get("nick", "").strip()[:50])
        if not nick:
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Укажи ник"})}
        cur.execute(f"SELECT friend_nick FROM {SCHEMA}.friends WHERE user_nick = '{nick}'")
        friends = [r[0] for r in cur.fetchall()]
        conn.close()
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"friends": friends})}

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        user_nick = esc((body.get("user_nick") or "").strip()[:50])
        friend_nick = esc((body.get("friend_nick") or "").strip()[:50])
        if not user_nick or not friend_nick:
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Укажи оба ника"})}
        if user_nick == friend_nick:
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Нельзя добавить себя"})}
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"INSERT INTO {SCHEMA}.friends (user_nick, friend_nick) VALUES ('{user_nick}', '{friend_nick}') ON CONFLICT DO NOTHING")
        cur.execute(f"INSERT INTO {SCHEMA}.friends (user_nick, friend_nick) VALUES ('{friend_nick}', '{user_nick}') ON CONFLICT DO NOTHING")
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

    if method == "DELETE":
        body = json.loads(event.get("body") or "{}")
        user_nick = esc((body.get("user_nick") or "").strip()[:50])
        friend_nick = esc((body.get("friend_nick") or "").strip()[:50])
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"DELETE FROM {SCHEMA}.friends WHERE (user_nick='{user_nick}' AND friend_nick='{friend_nick}') OR (user_nick='{friend_nick}' AND friend_nick='{user_nick}')")
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"ok": True})}

    return {"statusCode": 405, "headers": headers, "body": json.dumps({"error": "Method not allowed"})}
