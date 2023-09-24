from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash
import psycopg2
from flask_socketio import SocketIO, join_room, emit, leave_room
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from functools import wraps
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from passlib.hash import pbkdf2_sha256
from psycopg2.extras import NamedTupleCursor
from werkzeug.utils import secure_filename
import os
import base64

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'
socketio = SocketIO(app, async_mode='gevent')
CORS(app)

# PostgreSQL connection configuration
db_connection = psycopg2.connect(
    user="postgres",
    password="admin",
    host="localhost",
    database="postgres"
)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def search_users_in_database(username):
    cursor = db_connection.cursor()
    cursor.execute("SELECT * FROM users WHERE username ILIKE %s", (f'%{username}%',))
    user = cursor.fetchone()
    cursor.close()
    if user:
        # Return the user information as a dictionary
        return {'id': user[0], 'username': user[1], 'email': user[2]}
    else:
        # User not found
        return None
    
def is_existing_friend_request(user_id, friend_id):
    cursor = db_connection.cursor()
    cursor.execute(
        "SELECT EXISTS(SELECT 1 FROM friendships WHERE ((user_id = %s AND friend_id = %s) OR (user_id = %s AND friend_id = %s)) AND status = 'pending')",
        (user_id, friend_id, friend_id, user_id)
    )
    exists = cursor.fetchone()[0]
    cursor.close()
    return exists

def add_friend_to_database(current_user_id, friend_id):
    try:
        # Create the pending friendship record in the database
        cursor = db_connection.cursor()
        cursor.execute("INSERT INTO friendships (user_id, friend_id, status) VALUES (%s, %s, 'pending')", (current_user_id, friend_id))
        db_connection.commit()
        cursor.close()
        return True, "Friend request sent successfully."

    except Exception as e:
        db_connection.rollback()
        cursor.close()
        return False, f"Error sending friend request: {e}"


def add_friend(current_user_id, friend_username):
    friend = search_users_in_database(friend_username)
    
    if friend is None:
        return False, "User not found."

    # Check if the friendship already exists
    cursor = db_connection.cursor()
    cursor.execute("SELECT * FROM friendships WHERE user_id = %s AND friend_id = %s", (current_user_id, friend[0]))
    existing_friendship = cursor.fetchone()
    
    if existing_friendship:
        return False, "Friendship already exists."
    
    try:
        # Create the pending friendship record in the database
        cursor.execute("INSERT INTO friendships (user_id, friend_id, status) VALUES (%s, %s, 'pending')", (current_user_id, friend[0]))
        db_connection.commit()
        return True, "Friend request sent successfully."
    
    except Exception as e:
        db_connection.rollback()
        return False, f"Error sending friend request: {e}"
    
    finally:
        cursor.close()

def find_user_by_id(user_id):
    cursor = db_connection.cursor()
    cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()[1]
    cursor.close()
    return user

def fetch_friends(user_id):
    try:
        # Get the user's friends from the database
        cursor = db_connection.cursor()
        cursor.execute("""
            SELECT users.id, users.username, users.email
            FROM users
            INNER JOIN friendships ON (users.id = friendships.user_id OR users.id = friendships.friend_id)
            WHERE (friendships.user_id = %s OR friendships.friend_id = %s)
                AND friendships.status = 'accepted'
                AND users.id != %s
        """, (user_id, user_id, user_id))
        friends = cursor.fetchall()
        cursor.close()

        # Prepare the list of friends with user information
        friend_list = []
        for friend in friends:
            friend_info = {
                'id': friend[0],
                'username': friend[1],
                'email': friend[2]
                # Add other user information as needed
            }
            friend_list.append(friend_info)

        return friend_list

    except Exception as e:
        print("Error fetching friends:", e)
        return []

# Function to get all messages in a private chat between two users
def get_private_messages(user_id, other_user_id):
    cursor = db_connection.cursor()
    cursor.execute(
        "SELECT * FROM messages WHERE (sender_id = %s AND receiver_id = %s) OR (sender_id = %s AND receiver_id = %s)",
        (user_id, other_user_id, other_user_id, user_id)
    )
    messages = cursor.fetchall()
    cursor.close()
    return messages

def fetch_posts(user_id, privacy_condition=None):
    cursor = db_connection.cursor()
    query = """
    SELECT p.id, p.user_id, p.content, p.privacy, p.created_at, p.media_data, p.media_type
    FROM posts p
    LEFT JOIN friendships f1 ON p.user_id = f1.friend_id AND f1.user_id = %s AND f1.status = 'accepted'
    LEFT JOIN friendships f2 ON p.user_id = f2.user_id AND f2.friend_id = %s AND f2.status = 'accepted'
    WHERE (%s IS NULL OR %s = 'all' OR p.privacy = %s)
    AND (
        p.privacy = 'public' OR
        (p.privacy = 'friends' AND (p.user_id = %s OR f1.user_id IS NOT NULL OR f2.user_id IS NOT NULL)) OR
        (p.privacy = 'private' AND p.user_id = %s)
    )
    ORDER BY p.created_at DESC;
    """
    cursor.execute(query, (user_id, user_id, privacy_condition, privacy_condition, privacy_condition, user_id, user_id))
    
    posts = []
    for row in cursor.fetchall():
        post_id, author_id, content, privacy, created_at, media_data, media_type= row
        media_base64 = base64.b64encode(media_data).decode('utf-8') if media_data else None
        posts.append({
            "id": post_id,
            "user_id": author_id,
            "content": content,
            "privacy": privacy,
            "created_at": created_at.strftime('%Y-%m-%d %H:%M:%S'),
            "media_data": media_base64,
            "media_type": media_type
        })
    cursor.close()
    return posts


def get_media_type(filename):
    extension = filename.rsplit('.', 1)[1].lower()
    if extension in ['jpg', 'jpeg', 'png', 'gif']:
        return "image"
    elif extension in ['mp4', 'mov']:
        return "video"
    return None 

# Home page route
@app.route('/')
def home():
    return render_template('index.html')


# User registration route
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        # Get form data
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        confirm_password = request.form['confirm_password']

        # Check if password and confirm_password match
        if password != confirm_password:
            return render_template('register.html', error_message='Passwords do not match.')
        
        # Check if password meets minimum length requirement
        if len(password) < 8:
            return render_template('register.html', error_message='Password must be at least 8 characters long.')

        # Hash the password
        hashed_password = pbkdf2_sha256.hash(password)

        # Create a cursor to interact with the database
        cursor = db_connection.cursor()

        try:
            # Execute the INSERT query with prepared statement
            cursor.execute("INSERT INTO users (username, email, password) VALUES (%s, %s, %s)", (username, email, hashed_password))
            db_connection.commit()
        except Exception as e:
            db_connection.rollback()
            # Handle the exception or show an error message
            print(f"Error during registration: {e}")

        finally:
            # Close the cursor
            cursor.close()

        # Redirect to login page after successful registration
        return redirect(url_for('login'))

    return render_template('register.html')


# User login route
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Get form data
        username = request.form['username']
        password = request.form['password']

        # Create a cursor to interact with the database
        cursor = db_connection.cursor()

        try:
            # Execute the SELECT query with prepared statement
            cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
            user = cursor.fetchone()

            if user and pbkdf2_sha256.verify(password, user[3]):  # Assuming password is in the 4th column
                session['user_id'] = user[0]  # Assuming user ID is in the 1st column
                # Authentication successful, redirect to the main page
                return redirect(url_for('main_page'))
            else:
                # Authentication failed, display an error message (or redirect to login page with an error message)
                return render_template('login.html', error_message='Invalid username or password.')

        except Exception as e:
            # Handle the exception or show an error message
            print(f"Error during login: {e}")

        finally:
            # Close the cursor
            cursor.close()

    return render_template('login.html')

# Main page route (restricted, user must be logged in to access)
@app.route('/main')
@login_required
def main_page():
    return render_template('main.html')

# chat route
@app.route('/friends_list', methods=['POST'])
@login_required
def friends_list():
    return render_template('friends_pending_list.html')

# Route to handle the API request to find a user by username
@app.route('/api/users/<username>', methods=['GET'])
@login_required
def find_user(username):
    user = search_users_in_database(username)
    if user:
        # If the user is found, create a dictionary containing the user information
        user_info = {
            'id': user[0],
            'username': user[1],
            'email': user[2],
            'profile_picture': user[4],
            'bio': user[5]
            # Add other user information as needed
        }
        return jsonify(user_info)
    else:
        # If the user is not found, return a JSON response with an applicationropriate message
        return jsonify({'error': 'User not found'}), 404


# API route to handle adding a friend
@app.route('/api/add_friend/<string:friend_username>', methods=['POST'])
@login_required
def add_friend(friend_username):
    current_user_id = session['user_id']

    # Find the friend based on the friend_username provided
    friend = search_users_in_database(friend_username)

    if friend is None:
        return jsonify({'success': False, 'message': 'User not found.'}), 404

    # Extract the friend's ID from the search result
    friend_id = friend['id']

    # Prevent adding yourself as a friend
    if current_user_id == friend_id:
        return jsonify({'success': False, 'message': "You can't add yourself as a friend."}), 400

    # Check if an existing friend request already exists
    if is_existing_friend_request(current_user_id, friend_id):
        return jsonify({'success': False, 'message': "Friend request already pending."}), 400

    # Add the friend request to the database with status set to 'pending'
    success, message = add_friend_to_database(current_user_id, friend_id)

    # Handle the response based on success or failure
    if success:
        return jsonify({'success': True, 'message': 'Friend request sent successfully.'}), 200
    else:
        return jsonify({'success': False, 'message': message}), 400

@app.route('/api/accept_friend/<int:friendship_id>', methods=['PUT'])
@login_required
def update_friendship_status(friendship_id):
    try:
        status = "accepted"  # Set the status directly to "accepted"

        # Update the friendship status in the database
        print("Updating friendship status for friendship ID:", friendship_id)
        cursor = db_connection.cursor()
        cursor.execute("UPDATE friendships SET status = %s WHERE user_id = %s", (status, friendship_id))
        db_connection.commit()
        cursor.close()

        return jsonify({"message": f"Friendship status updated to accepted"}), 200

    except Exception as e:
        print("Error updating friendship status:", e)
        db_connection.rollback()
        cursor.close()
        return jsonify({"error": "Failed to update friendship status"}), 500


@app.route('/api/pending_friend_list', methods=['GET'])
def get_friend_list():
    try:
        current_user_id = session['user_id']  # Assuming you have a way to get the current user's ID

        # Query the database to get the incoming friend requests for the current user with 'pending' status
        cursor = db_connection.cursor()
        cursor.execute("""
            SELECT users.id, users.username, users.profile_picture
            FROM users
            JOIN friendships ON users.id = friendships.user_id
            WHERE friendships.friend_id = %s
                AND friendships.status = 'pending'
        """, (current_user_id,))

        friend_list = []
        for row in cursor.fetchall():
            friend_id, username, profile_picture = row
            friend_list.append({
                'id': friend_id,
                'name': username,
                'profilePicture': profile_picture
            })

        cursor.close()

        return jsonify(friend_list), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch friend list.', 'message': str(e)}), 500
    
@app.route('/api/friends', methods=['GET'])
@login_required
def get_friends():
    current_user_id = session.get('user_id')
    if current_user_id:
        friends = fetch_friends(current_user_id)
        return jsonify(friends), 200
    else:
        return jsonify({'error': 'User not authenticated'}), 401


@app.route('/private_chat/<int:friend_id>')
@login_required
def private_chatroom(friend_id):
    # Fetch the current user's information from the database using the user_id from the session
    user_id = session['user_id']
    cursor = db_connection.cursor()
    cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    cursor.close()

    # Fetch the selected friend's information from the database using the friend_id from the URL
    cursor = db_connection.cursor()
    cursor.execute("SELECT * FROM users WHERE id = %s", (friend_id,))
    friend = cursor.fetchone()
    cursor.close()

    # Render the private chatroom template with the user and friend information
    return render_template('private_chatroom.html', user=user, friend=friend)



@app.route('/profile')
@login_required
def profile():
    # Fetch the user's information from the database using the user_id from the session
    user_id = session['user_id']
    cursor = db_connection.cursor()
    cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    cursor.close()

    # Pass the user's information to the template
    # Assuming the column order is: id, username, email, password, profile_image, bio
    return render_template('profile.html', username=user[1], email=user[2], profile_image=user[4], bio=user[5])

@app.route('/update_profile', methods=['POST'])
@login_required
def update_profile():
    # Get the form data submitted by the user
    username = request.form['username']
    email = request.form['email']
    bio = request.form['bio']

    # Update the user's information in the database using the user_id from the session
    user_id = session['user_id']
    cursor = db_connection.cursor()
    cursor.execute("UPDATE users SET username = %s, email = %s, bio = %s WHERE id = %s", (username, email, bio, user_id))
    db_connection.commit()
    cursor.close()

    # Redirect the user back to the profile page after the update
    return redirect(url_for('profile'))

@app.route('/logout')
def logout():
    # Clear the user's session data
    session.clear()
    
    # Redirect the user to the login page
    return redirect(url_for('login'))


@app.route('/friends', methods=['GET'])
@login_required
def chat():
    return render_template('friend_list.html')

@socketio.on('connect')
@login_required
def handle_connect():
    print('User connected')

@socketio.on('join')
def join(data):
    user_id = session['user_id']
    room = data['room']
    join_room(room)
    emit('message', {'username': 'System', 'message': f'User {user_id} has joined the room'}, room=room)

@socketio.on('message')
def message(data):
    user_id = session['user_id']
    user = find_user_by_id(user_id)  # Retrieve user details
    if user:
        emit('message', {'username': user, 'message': data['message']}, room=data['room'])
    else:
        emit('message', {'username': 'Unknown User', 'message': data['message']}, room=data['room'])

@app.route('/create_post', methods=['GET'])
@login_required
def create_post():
    return render_template('create_post.html')

@app.route('/api/create_post', methods=['POST'])
@login_required
def create_post_api():
    try:
        content = request.form.get('content')
        privacy = request.form.get('privacy')
        user_id = session['user_id']

        # Get the uploaded file
        media_file = request.files.get('media_file')

        if media_file:
            media_data = media_file.read()  # Read the binary data of the file
            media_type = get_media_type(media_file.filename)
        else:
            media_data = None
            media_type = None

        # Get latitude and longitude values
        latitude = request.form.get('latitude')
        longitude = request.form.get('longitude')

        # Insert the post into the database with latitude and longitude
        cursor = db_connection.cursor()
        insert_query = """
        INSERT INTO posts (user_id, content, media_type, media_data, privacy, latitude, longitude)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(insert_query, (user_id, content, media_type, media_data, privacy, latitude, longitude))
        db_connection.commit()
        cursor.close()

        return jsonify({"message": "Post created successfully!"})

    except Exception as e:
        # Handle any exceptions, e.g., database errors or form validation errors
        return jsonify({"error": str(e)})

@app.route('/post', methods=['GET'])
@login_required
def show_all_posts():
    return render_template('post.html')

@app.route('/api/posts', methods=['GET'])
@login_required
def get_posts_api():
    user_id = session['user_id']
    
    privacy_condition = request.args.get('privacy_condition', None)
    posts = fetch_posts(user_id, privacy_condition)
    
    return jsonify({"posts": posts})

@app.route('/api/get_lat_lng', methods=['GET'])
@login_required
def get_lat_lng():
    user_id = session['user_id']
    cursor = db_connection.cursor()
    query = """
    SELECT latitude, longitude, user_id
    FROM posts
    WHERE (user_id IN (SELECT friend_id FROM friendships WHERE user_id = %s)
    OR (user_id = %s AND privacy = 'public')
    OR user_id IN (SELECT user_id FROM friendships WHERE friend_id = %s)
    OR (user_id = %s AND privacy = 'public'))
    OR user_id = %s
    """
    cursor.execute(query, (user_id, user_id, user_id, user_id, user_id))
    lat_lng_data = cursor.fetchall()
    cursor.close()
    # Convert the result to a list of dictionaries
    lat_lng_list = [{"latitude": row[0], "longitude": row[1], "user_id": row[2]} for row in lat_lng_data]
    return jsonify(lat_lng_list)

@app.route('/delete_post/api/<int:post_id>', methods=['DELETE'])
@login_required
def delete_post(post_id):
    user_id = session['user_id']
    cursor = db_connection.cursor()

    # Check if the current user is the owner of the post
    cursor.execute('SELECT user_id FROM posts WHERE id = %s', (post_id,))
    post_owner = cursor.fetchone()

    if post_owner and post_owner[0] == user_id:
        cursor.execute('DELETE FROM posts WHERE id = %s', (post_id,))
        db_connection.commit()
        cursor.close()
        return jsonify({"message": "Post deleted successfully!"}), 200
    else:
        cursor.close()
        return jsonify({"message": "You do not have permission to delete this post."}), 403


if __name__ == '__main__':
    app.run(debug=True)
