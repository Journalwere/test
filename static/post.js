document.addEventListener("DOMContentLoaded", () => {
    const postsDiv = document.getElementById("posts");

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
            deleteButton.classList.add("btn", "btn-danger");
            deleteButton.setAttribute("data-toggle", "modal");
            deleteButton.setAttribute("data-target", `#deleteModal${post.id}`);
            postDiv.appendChild(deleteButton);
            postsDiv.appendChild(postDiv);

            const modal = `
                <div class="modal fade" id="deleteModal${post.id}" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div class="modal-dialog" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="exampleModalLabel">Confirm Delete</h5>
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div class="modal-body">
                                Are you sure you want to delete this post?
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-danger" data-postid="${post.id}">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML("beforeend", modal);
        }
    }

    document.addEventListener("click", function(e) {
        if (e.target && e.target.classList.contains("btn-danger")) {
            const postId = e.target.getAttribute("data-postid");
            const modalId = `#deleteModal${postId}`;
            $(modalId).modal('show');
        }
    });

    document.addEventListener("click", function(e) {
        if (e.target && e.target.classList.contains("btn-danger") && e.target.hasAttribute("data-postid")) {
            const postId = e.target.getAttribute("data-postid");
            deletePost(postId);
        }
    });

    
    function deletePost(postId) {
        const url = `/delete_post/api/${postId}`;
    
        fetch(url, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                console.log(data.message);
                location.reload(); // Reload the page after successful deletion
            } else {
                console.error("Error deleting post:", data.error);
            }
        })
        .catch(error => {
            console.error("Error deleting post:", error);
        });
    }
    

    fetchPosts(); // Initial fetch
});
