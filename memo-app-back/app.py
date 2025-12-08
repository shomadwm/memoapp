from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, Memo, User, Follow  # Follow を追加
from sqlalchemy import inspect, text
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
    # --- Runtime lightweight migration for legacy memo table without user_id ---
    inspector = inspect(db.engine)
    memo_columns = [c['name'] for c in inspector.get_columns('memo')]
    if 'user_id' not in memo_columns:
        # 1. Add user_id column (nullable for now to avoid failing on existing rows)
        db.session.execute(text('ALTER TABLE memo ADD COLUMN user_id INTEGER'))
        db.session.commit()
        # 2. Ensure a default legacy user exists
        legacy_user = User.query.filter_by(email='legacy@example.com').first()
        if not legacy_user:
            legacy_user = User(username='legacy', email='legacy@example.com', password_hash=generate_password_hash('change_me_legacy'))
            db.session.add(legacy_user)
            db.session.commit()
        # 3. Assign all existing memo rows to legacy user where user_id IS NULL
        db.session.execute(text('UPDATE memo SET user_id = :uid WHERE user_id IS NULL'), {'uid': legacy_user.id})
        db.session.commit()
        print('[Migration] Added user_id column to memo and assigned legacy user id', legacy_user.id)

# --- API エンドポイント ---

# メモ一覧の取得
@app.route('/memos', methods=['GET'])
def get_memos():
    # 必須: user_id クエリパラメータ
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({'error': 'user_id クエリパラメータが必要です'}), 400
    memos = Memo.query.filter_by(user_id=user_id).order_by(Memo.created_at.desc()).all()
    return jsonify([memo.to_dict() for memo in memos])

# 新しいメモの作成
@app.route('/memos', methods=['POST'])
def create_memo():
    data = request.get_json() or {}
    required = ['title', 'content', 'user_id']
    if not all(k in data and data[k] for k in required):
        return jsonify({'error': 'title, content, user_id は必須です'}), 400
    # user存在確認
    user = User.query.get(data['user_id'])
    if not user:
        return jsonify({'error': '指定されたユーザーが存在しません'}), 404
    new_memo = Memo(
        title=data['title'],
        content=data['content'],
        background_color=data.get('background_color', '#FFFFFF'),
        user_id=user.id
    )
    db.session.add(new_memo)
    db.session.commit()
    return jsonify(new_memo.to_dict()), 201

# 特定のメモの更新
@app.route('/memos/<int:memo_id>', methods=['PUT'])
def update_memo(memo_id):
    memo = Memo.query.get_or_404(memo_id)
    data = request.get_json() or {}
    user_id = data.get('user_id')
    if not user_id or memo.user_id != user_id:
        return jsonify({'error': '権限がありません (user_id 不一致)'}), 403
    memo.title = data.get('title', memo.title)
    memo.content = data.get('content', memo.content)
    memo.background_color = data.get('background_color', memo.background_color)
    db.session.commit()
    return jsonify(memo.to_dict())

# 特定のメモの削除
@app.route('/memos/<int:memo_id>', methods=['DELETE'])
def delete_memo(memo_id):
    memo = Memo.query.get_or_404(memo_id)
    user_id = request.args.get('user_id', type=int)
    if not user_id or memo.user_id != user_id:
        return jsonify({'error': '権限がありません (user_id 不一致)'}), 403
    db.session.delete(memo)
    db.session.commit()
    return '', 204

# --- 認証関連エンドポイント ---

@app.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not username or not email or not password:
        return jsonify({'error': 'username, email, password は必須です'}), 400
    if len(password) < 8:
        return jsonify({'error': 'パスワードは8文字以上にしてください'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'このメールアドレスは既に登録されています'}), 409

    password_hash = generate_password_hash(password)
    user = User(username=username, email=email, password_hash=password_hash)
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': '登録成功', 'user': user.to_dict()}), 201


@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    if not email or not password:
        return jsonify({'error': 'email と password は必須です'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'メールアドレスまたはパスワードが違います'}), 401

    # 今回は簡易的にユーザー情報のみ返却（トークン管理を簡略化）
    return jsonify({'message': 'ログイン成功', 'user': user.to_dict()}), 200


# --- ユーザー検索エンドポイント ---

@app.route('/users/search', methods=['GET'])
def search_users():
    """ユーザー名で前方一致検索"""
    query = request.args.get('q', '').strip()
    current_user_id = request.args.get('user_id', type=int)
    if not query:
        return jsonify([])
    users = User.query.filter(User.username.like(f'{query}%')).all()
    # 自分自身を除外
    result = [u.to_dict() for u in users if u.id != current_user_id]
    return jsonify(result)


# --- フォロー関連エンドポイント ---

@app.route('/follows', methods=['GET'])
def get_follows():
    """自分がフォローしているユーザー一覧を取得"""
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({'error': 'user_id クエリパラメータが必要です'}), 400
    follows = Follow.query.filter_by(follower_id=user_id).all()
    # フォロー先ユーザー情報も含めて返す
    result = []
    for f in follows:
        followed_user = User.query.get(f.followed_id)
        if followed_user:
            result.append({
                'follow_id': f.id,
                'user': followed_user.to_dict(),
                'created_at': f.created_at.isoformat()
            })
    return jsonify(result)


@app.route('/follows', methods=['POST'])
def create_follow():
    """ユーザーをフォローする"""
    data = request.get_json() or {}
    follower_id = data.get('follower_id')
    followed_id = data.get('followed_id')
    if not follower_id or not followed_id:
        return jsonify({'error': 'follower_id と followed_id は必須です'}), 400
    if follower_id == followed_id:
        return jsonify({'error': '自分自身をフォローできません'}), 400
    # 既にフォロー済みかチェック
    existing = Follow.query.filter_by(follower_id=follower_id, followed_id=followed_id).first()
    if existing:
        return jsonify({'error': '既にフォローしています'}), 409
    # フォロー先ユーザーの存在確認
    followed_user = User.query.get(followed_id)
    if not followed_user:
        return jsonify({'error': '指定されたユーザーが存在しません'}), 404
    follow = Follow(follower_id=follower_id, followed_id=followed_id)
    db.session.add(follow)
    db.session.commit()
    return jsonify({
        'follow_id': follow.id,
        'user': followed_user.to_dict(),
        'created_at': follow.created_at.isoformat()
    }), 201


@app.route('/follows/<int:follow_id>', methods=['DELETE'])
def delete_follow(follow_id):
    """フォローを解除する"""
    user_id = request.args.get('user_id', type=int)
    follow = Follow.query.get_or_404(follow_id)
    if not user_id or follow.follower_id != user_id:
        return jsonify({'error': '権限がありません'}), 403
    db.session.delete(follow)
    db.session.commit()
    return '', 204


# --- フォローユーザーのメモ取得エンドポイント ---

@app.route('/memos/following', methods=['GET'])
def get_following_memos():
    """フォローしているユーザーのメモ一覧を取得"""
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({'error': 'user_id クエリパラメータが必要です'}), 400
    # フォロー中のユーザーIDリストを取得
    follows = Follow.query.filter_by(follower_id=user_id).all()
    followed_ids = [f.followed_id for f in follows]
    if not followed_ids:
        return jsonify([])
    # フォロー中ユーザーのメモを取得
    memos = Memo.query.filter(Memo.user_id.in_(followed_ids)).order_by(Memo.created_at.desc()).all()
    # メモにユーザー名も追加して返す
    result = []
    for memo in memos:
        memo_dict = memo.to_dict()
        user = User.query.get(memo.user_id)
        memo_dict['username'] = user.username if user else 'Unknown'
        result.append(memo_dict)
    return jsonify(result)


# アプリケーションの実行
if __name__ == '__main__':
    app.run(debug=True)