var socket = io.connect('http://' + document.domain + ':' + location.port);
var room = "{{ room }}"; // Generate a unique room ID
var user_id = "{{ user_id }}"; // Replace with your actual user ID

socket.emit('join', {'user_id': user_id, 'room': room});

function sendMessage() {
    var message = document.getElementById('message').value;
    socket.emit('message', {'user_id': user_id, 'message': message, 'room': room});
    document.getElementById('message').value = '';
}

socket.on('message', function(data) {
    var chatDiv = document.getElementById('chat');
    chatDiv.innerHTML += '<p><strong>' + data.username + ':</strong> ' + data.message + '</p>';
});
