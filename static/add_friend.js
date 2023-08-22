function addFriend() {
    const friendUsername = document.getElementById('friendUsername').value;

    fetch(`/api/add_friend/${friendUsername}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('message').innerText = data.message;
        } else {
            document.getElementById('message').innerText = data.message;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('message').innerText = 'An error occurred while processing the request.';
    });
}

async function updateFriendshipStatus(friendshipId, status) {
    try {
        const response = await fetch(`/api/accept_friend/${friendshipId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status }),
        });

        const data = await response.json();
        console.log(data.message); // You can handle success messages here

        // Check if the status is 'accepted', and if so, remove the friend item from the UI
        if (status === 'accepted') {
            const friendItem = document.querySelector(`[data-friendship-id="${friendshipId}"]`);
            if (friendItem) {
                friendItem.remove();
            }
        }
    } catch (error) {
        console.error("Error updating friendship status:", error);
        // Handle error messages or display a notification to the user
    }
}

function handleButtonClick(event) {
    const friendshipId = event.target.dataset.friendshipId;
    const status = event.target.dataset.status;

    updateFriendshipStatus(friendshipId, status);
}

function renderFriendList(friends) {
    const friendList = document.getElementById('friendList');
    friendList.innerHTML = '';

    friends.forEach(friend => {
        const friendItem = document.createElement('li');
        friendItem.className = 'friend-item';
        friendItem.innerHTML = `
            <img src="${friend.profilePicture}" alt="${friend.name}">
            <span>${friend.name}</span>
            <div class="friend-actions">
            <button data-friendship-id="${friend.id}" data-status="accepted" onclick="handleButtonClick(event)">Accept</button>
            </div>
        `;
        friendList.appendChild(friendItem);
    });
}


// Function to fetch the friend list from your backend API
async function fetchFriendList() {
    try {
        const response = await fetch('/api/pending_friend_list'); // Replace with your API endpoint
        if (!response.ok) {
            throw new Error('Failed to fetch friend list.');
        }
        const friendList = await response.json();
        renderFriendList(friendList);
    } catch (error) {
        console.error(error);
    }
}


// Call the fetchPendingFriendships function when the page loads
fetchFriendList();
