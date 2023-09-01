document.addEventListener("DOMContentLoaded", function () {
    const createPostBtn = document.getElementById("create-post-btn");
    const responseMessage = document.getElementById("response-message");

    createPostBtn.addEventListener("click", function () {
        const content = document.getElementById("content").value;
        const privacy = document.getElementById("privacy").value;

        const mediaFileInput = document.getElementById("mediaFile");
        const selectedFile = mediaFileInput.files[0]; // Get the selected file
        const mediaType = getMediaType(selectedFile); // Function to get media type

        if (!mediaType) {
            responseMessage.textContent = "Unsupported media type!";
            return;
        }

        // Get geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function (position) {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;

                    const formData = new FormData();
                    formData.append("content", content);
                    formData.append("media_type", mediaType);
                    formData.append("media_file", selectedFile); // Append the file to FormData
                    formData.append("privacy", privacy);
                    formData.append("latitude", latitude); // Append latitude
                    formData.append("longitude", longitude); // Append longitude

                    // Send the form data to the server
                    fetch("/api/create_post", {
                        method: "POST",
                        body: formData,
                    })
                        .then(response => response.json())
                        .then(data => {
                            responseMessage.textContent = data.message;
                        })
                        .catch(error => {
                            responseMessage.textContent = "Error creating post: " + error;
                        });
                },
                function (error) {
                    responseMessage.textContent = "Geolocation error: " + error.message;

                    // Proceed without geolocation
                    sendFormWithoutGeolocation(content, privacy, selectedFile, mediaType);
                }
            );
        } else {
            responseMessage.textContent = "Geolocation is not supported by this browser.";

            // Proceed without geolocation
            sendFormWithoutGeolocation(content, privacy, selectedFile, mediaType);
        }
    });

    // Function to send form data without geolocation
    function sendFormWithoutGeolocation(content, privacy, selectedFile, mediaType) {
        const formData = new FormData();
        formData.append("content", content);
        formData.append("media_type", mediaType);
        formData.append("media_file", selectedFile); // Append the file to FormData
        formData.append("privacy", privacy);

        // Send the form data to the server
        fetch("/api/create_post", {
            method: "POST",
            body: formData,
        })
            .then(response => response.json())
            .then(data => {
                responseMessage.textContent = data.message;
            })
            .catch(error => {
                responseMessage.textContent = "Error creating post: " + error;
            });
    }

    // Function to determine media type based on file extension
    function getMediaType(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
            return "image";
        } else if (['mp4', 'mov'].includes(extension)) {
            return "video";
        }
        return null; // Unsupported extension
    }
});
