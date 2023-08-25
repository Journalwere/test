SELECT * FROM users;

--@block
SELECT * FROM friendships;

--@block
SELECT * FROM posts

--@block 
UPDATE friendships
SET status = 'pending'
WHERE friend_id = 4

--@block
SELECT * FROM groups;

--@block
SELECT * FROM group_memberships;

--@block
SELECT * FROM posts;

--@block
SELECT * FROM likes;
SELECT * FROM comments;
SELECT * FROM shares;
SELECT * FROM notifications;

--@block
SELECT * FROM messages

--@block
ALTER SEQUENCE users_id_seq RESTART WITH 1;

--@block
ALTER SEQUENCE friendships_id_seq RESTART WITH 1;

--@block 
alter SEQUENCE GROUPS_id_seq restart with 1;

--@block
DELETE FROM users
WHERE id IN(1, 2, 3, 4, 5, 6);

--@block
DELETE FROM friendships
WHERE id IN(1, 2);

--@block
delete from groups 
where id in (1, 2, 3);

--@block
delete from group_memberships; 
where id in (5, 6, 7, 8);
--@block
-- Inserting data into the users table
INSERT INTO users (username, email, password, profile_picture, bio)
VALUES 
    ('JohnDoe', 'johndoe@example.com', 'hashed_password', 'profile_pic.jpg', 'Hello, I am John.'),
    ('JaneSmith', 'janesmith@example.com', 'hashed_password', NULL, 'Nice to meet you!'),
    ('AliceGreen', 'alicegreen@example.com', 'hashed_password', 'profile_pic.jpg', 'Excited to be here!');

--@block
-- Inserting data into the friendships table
INSERT INTO friendships (user_id, friend_id, status)
VALUES
    (1, 2, 'pending'),
    (2, 3, 'accepted'),
    (3, 1, 'accepted');

--@block
-- Inserting data into the groups table
INSERT INTO groups (name, description, created_by)
VALUES
    ('Book Club', 'A group for discussing books.', 1),
    ('Fitness Enthusiasts', 'A group for fitness lovers.', 2),
    ('Photography Club', 'A group for photography enthusiasts.', 3);

--@block
-- Inserting data into the group_memberships table
INSERT INTO group_memberships (group_id, user_id)
VALUES
    (1, 2),
    (1, 3),
    (2, 1),
    (3, 2);

--@block
-- Inserting data into the posts table
INSERT INTO posts (user_id, content, media_type, media_url, privacy)
VALUES
    (1, 'Hello, everyone!', 'text', NULL, 'public'),
    (2, 'Check out this amazing book!', 'text', NULL, 'friends'),
    (3, 'Beautiful sunset captured today.', 'image', 'sunset.jpg', 'public');

--@block
-- Inserting data into the likes table
INSERT INTO likes (post_id, user_id)
VALUES
    (1, 2),
    (1, 3),
    (2, 1);

--@block
-- Inserting data into the comments table
INSERT INTO comments (post_id, user_id, content)
VALUES
    (1, 2, 'Great post!'),
    (1, 3, 'Nice one!');

--@block
-- Inserting data into the shares table
INSERT INTO shares (post_id, user_id)
VALUES
    (1, 2),
    (2, 3);

--@block
-- Inserting data into the notifications table
INSERT INTO notifications (user_id, message, type, is_read)
VALUES
    (1, 'You have a new message!', 'message', false),
    (2, 'Your post got a new like.', 'like', false);


--@block
ALTER TABLE users ADD COLUMN pending_friend_requests integer[];

--@block
ALTER TABLE friendships
ADD COLUMN sender_id INTEGER REFERENCES users(id),
ADD COLUMN receiver_id INTEGER REFERENCES users(id);

--@block
ALTER TABLE friendships
ADD COLUMN action_user_id INTEGER NOT NULL DEFAULT 0;

--@block
UPDATE friendships
SET action_user_id = 0,  -- Replace 0 with the default value for action_user_id
    status = 'pending';

--@block
ALTER TABLE friendships
ALTER COLUMN status TYPE VARCHAR(20)
