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
    
        const progressBar = document.getElementById("progress-bar");
        const progressBarContainer = document.getElementById("progress-bar-container");
        progressBarContainer.style.display = "block";
    
        const xhr = new XMLHttpRequest();
    
        xhr.upload.addEventListener("progress", function(event) {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 100;
                progressBar.style.width = percentComplete + "%";
                progressBar.textContent = Math.round(percentComplete) + "%";
            }
        });
    
        xhr.onreadystatechange = function() {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    responseMessage.textContent = "Post created successfully!";
                } else {
                    responseMessage.textContent = "Error creating post: " + xhr.responseText;
                }
                progressBarContainer.style.display = "none";
            }
        };
    
        xhr.open("POST", "/api/create_post", true);
        xhr.send(formData);
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
