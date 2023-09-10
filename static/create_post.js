document.addEventListener("DOMContentLoaded", function () {
    const locationInput = document.getElementById("location");
    const suggestionsContainer = document.getElementById("suggestions");

    const autocomplete = new google.maps.places.Autocomplete(locationInput);

    autocomplete.addListener("place_changed", function() {
        const place = autocomplete.getPlace();
        if (!place.geometry) {
            return;
        }

        const latitude = place.geometry.location.lat();
        const longitude = place.geometry.location.lng();

        document.getElementById("latitude").value = latitude;
        document.getElementById("longitude").value = longitude;
    });

    const createPostBtn = document.getElementById("create-post-btn");
    const responseMessage = document.getElementById("response-message");

    createPostBtn.addEventListener("click", function () {
        const content = document.getElementById("content").value;
        const privacy = document.getElementById("privacy").value;

        const mediaFileInput = document.getElementById("mediaFile");
        const selectedFile = mediaFileInput.files[0];
        const mediaType = getMediaType(selectedFile);

        if (!mediaType) {
            responseMessage.textContent = "Unsupported media type!";
            return;
        }

        // Send form data without geolocation
        sendFormWithGeolocation(content, privacy, selectedFile, mediaType);
    });

    function sendFormWithGeolocation(content, privacy, selectedFile, mediaType) {
        const formData = new FormData();
        formData.append("content", content);
        formData.append("media_type", mediaType);
        formData.append("media_file", selectedFile);
        formData.append("privacy", privacy);
        formData.append("latitude", document.getElementById("latitude").value);
        formData.append("longitude", document.getElementById("longitude").value);

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

    function getMediaType(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
            return "image";
        } else if (['mp4', 'mov'].includes(extension)) {
            return "video";
        }
        return null;
    }
});
