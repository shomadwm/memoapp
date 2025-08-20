from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import pytz

JST = pytz.timezone('Asia/Tokyo') # 日本標準時を設定

db = SQLAlchemy()

class Memo(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now(JST))
    updated_at = db.Column(db.DateTime, default=datetime.now(JST), onupdate=datetime.now(JST))
    background_color = db.Column(db.String(7), default='#FFFFFF') # 例: #RRGGBB形式

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'created_at': self.created_at.isoformat(), # ISO形式で文字列化
            'updated_at': self.updated_at.isoformat(),
            'background_color': self.background_color
        }