document.addEventListener("DOMContentLoaded", () => {
    const postsDiv = document.getElementById("posts");

    fetchPosts();

    function fetchPosts() {
        const url = "/api/posts";

        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log(data);
                displayPosts(data.posts);
            })
            .catch(error => {
                console.error("Error fetching posts:", error);
            });
    }

    function displayPosts(posts) {
        postsDiv.innerHTML = "";
        if (posts.length === 0) {
            postsDiv.textContent = "No posts available.";
            return;
        }
    
        for (const post of posts) {

            console.log("Post ID:", post.id); // Debug line
            const postDiv = document.createElement("div");
            postDiv.classList.add("post");
            postDiv.innerHTML = `
                <h3>Author: ${post.username}</h3> 
                <h2>${post.content}</h2>
                <p>Privacy: ${post.privacy}</p>
                <p>Created at: ${post.created_at}</p>
            `;
    
            if (post.media_data) {
                if (post.media_type === 'image') {
                    const img = document.createElement("img");
                    img.src = `data:image/jpeg;base64,${post.media_data}`;
                    img.alt = "Image";
                    postDiv.appendChild(img);
                } else if (post.media_type === 'video') {
                    const video = document.createElement("video");
                    video.controls = true;
                    video.src = `data:video/mp4;base64,${post.media_data}`;
                    postDiv.appendChild(video);
                }
            }
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", () => {
                console.log("Delete button clicked for post ID:", post.id); // Debug line
                deletePost(post.id);
            });
            postDiv.appendChild(deleteButton);
            postsDiv.appendChild(postDiv);
        }
    }

    function deletePost(postId) {
        const url = `/delete_post/api/${postId}`;

        fetch(url, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                console.log(data.message);
            } else {
                console.error("Error deleting post:", data.error);
            }
        })
        .catch(error => {
            console.error("Error deleting post:", error);
        });
    }
    
});
document.addEventListener("DOMContentLoaded", fetchPosts);
