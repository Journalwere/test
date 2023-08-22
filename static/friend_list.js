function fetchFriends() {
    fetch('/api/friends', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin'  // Include cookies for authentication
    })
    .then(response => response.json())
    .then(data => {
        // Handle the response data and update the friends list on the page
        const friendsList = document.getElementById('friends-list');
        friendsList.innerHTML = '';  // Clear existing list

        data.forEach(friend => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `${friend.username} - ${friend.email}`;

            // Create the "Message" button
            const messageButton = document.createElement('button');
            messageButton.innerHTML = 'Message';
            messageButton.addEventListener('click', () => initiateChatroom(friend.id));

            listItem.appendChild(messageButton);
            friendsList.appendChild(listItem);
        });
    })
    .catch(error => console.error('Error fetching friends:', error));
}
function initiateChatroom(friendId) {
    // Redirect the user to the chatroom page with the selected friend's ID
    window.location.href = `/private_chat/${friendId}`;
}

// Call the fetchFriends function when the page loads
window.onload = fetchFriends;