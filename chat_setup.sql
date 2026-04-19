-- 기존에 생성되었던 테이블이 있다면 깨끗하게 제거 (새로운 채팅 데이터가 이미 있다면 주의하세요!)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_rooms CASCADE;

-- 1. 방 정보 테이블 생성
CREATE TABLE chat_rooms (
    room_name TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    retention_hours INTEGER DEFAULT 24,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 채팅 메시지 테이블 생성
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_name TEXT REFERENCES chat_rooms(room_name) ON DELETE CASCADE,
    nickname TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'message',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS 보안 정책 설정 (가장 간단한 방식: 모두 허용 후 프론트엔드 검증)
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/insert on chat_rooms"
ON chat_rooms FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read/insert on chat_messages"
ON chat_messages FOR ALL USING (true) WITH CHECK (true);

-- 4. 실시간(Realtime) 설정 활성화 (이미 되어있을 경우를 대비해 수동 설정 권장)
-- ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
