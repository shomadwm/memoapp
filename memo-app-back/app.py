from flask import Flask, request, jsonify
from flask_cors import CORS
from models import db, Memo # 同じファイル内に定義する場合は from models は不要
from datetime import datetime
import pytz

# アプリケーションの初期設定
app = Flask(__name__)
# SQLiteデータベースのファイルパス
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///memo.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
CORS(app) # Reactからのアクセスを許可

# 日本時間のタイムゾーンオブジェクト
JST = pytz.timezone('Asia/Tokyo')

# アプリケーション起動時にデータベーステーブルを作成
with app.app_context():
    db.create_all()

# --- API エンドポイント ---

# メモ一覧の取得
@app.route('/memos', methods=['GET'])
def get_memos():
    memos = Memo.query.order_by(Memo.created_at.desc()).all()
    return jsonify([memo.to_dict() for memo in memos])

# 新しいメモの作成
@app.route('/memos', methods=['POST'])
def create_memo():
    data = request.get_json()
    new_memo = Memo(
        title=data['title'],
        content=data['content'],
        background_color=data.get('background_color', '#FFFFFF')
    )
    db.session.add(new_memo)
    db.session.commit()
    return jsonify(new_memo.to_dict()), 201

# 特定のメモの更新
@app.route('/memos/<int:memo_id>', methods=['PUT'])
def update_memo(memo_id):
    memo = Memo.query.get_or_404(memo_id)
    data = request.get_json()
    memo.title = data.get('title', memo.title)
    memo.content = data.get('content', memo.content)
    memo.background_color = data.get('background_color', memo.background_color)
    db.session.commit()
    return jsonify(memo.to_dict())

# 特定のメモの削除
@app.route('/memos/<int:memo_id>', methods=['DELETE'])
def delete_memo(memo_id):
    memo = Memo.query.get_or_404(memo_id)
    db.session.delete(memo)
    db.session.commit()
    return '', 204

# アプリケーションの実行
if __name__ == '__main__':
    app.run(debug=True)